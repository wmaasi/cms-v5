"""
Script de Migración: Strapi v4 → Strapi v5
==========================================
Copia los datos de brainstrapi (v4) a brainstrapi5 (v5)

Uso:
    pip install mysql-connector-python
    python migrate_strapi_v4_to_v5.py

Configura las variables en la sección CONFIG antes de correr.
"""

import mysql.connector
import uuid
import sys
from datetime import datetime

# ─────────────────────────────────────────
# CONFIG — ajusta estos valores
# ─────────────────────────────────────────
DB_HOST     = "35.223.43.203"
DB_USER     = "william"
DB_PASSWORD = "Amil@m1a20"   # reemplaza con tu password
DB_V4       = "brainstrapi"
DB_V5       = "brainstrapi5"
# ─────────────────────────────────────────

# Tablas a OMITIR (internas de Strapi, vistas, o que v5 maneja solo)
SKIP_TABLES = {
    # Vistas de v4
    "vw_country_relations",
    "vw_country_taxonomy_map",
    "vw_hs_taxonomy_map",
    # Tablas internas de Strapi que NO se migran
    "strapi_migrations",
    "strapi_migrations_internal",
    "strapi_database_schema",
    "strapi_core_store_settings",
    "strapi_history_versions",
    "strapi_sessions",
    "strapi_ai_localization_jobs",
    "strapi_ai_metadata_jobs",
    # Tablas de admin que ya existen en v5
    "admin_permissions",
    "admin_permissions_role_links",
    "admin_roles",
    "admin_users",
    "admin_users_roles_links",
    # Tablas de permisos que v5 regenera
    "up_permissions",
    "up_permissions_role_links",
    "up_roles",
}

def log(msg, level="INFO"):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] [{level}] {msg}")

def get_columns(cursor, db, table):
    cursor.execute(f"DESCRIBE `{db}`.`{table}`")
    return [row[0] for row in cursor.fetchall()]

def table_exists(cursor, db, table):
    cursor.execute(f"""
        SELECT COUNT(*) FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s
    """, (db, table))
    return cursor.fetchone()[0] > 0

def get_v4_tables(cursor):
    cursor.execute(f"SHOW FULL TABLES FROM `{DB_V4}` WHERE Table_type = 'BASE TABLE'")
    return [row[0] for row in cursor.fetchall()]

def map_table_name(v4_table):
    """Mapea nombre de tabla v4 → v5"""
    # _links → _lnk
    if v4_table.endswith("_links"):
        return v4_table[:-6] + "_lnk"
    # _components → _cmps
    if v4_table.endswith("_components"):
        return v4_table[:-11] + "_cmps"
    # files_related_morphs → files_related_mph
    if v4_table == "files_related_morphs":
        return "files_related_mph"
    # El resto igual
    return v4_table

def map_column_name(col):
    """Mapea nombre de columna v4 → v5"""
    # _order → _ord en tablas de relaciones
    if col.endswith("_order"):
        return col[:-6] + "_ord"
    # component_id → cmp_id en tablas de componentes
    if col == "component_id":
        return "cmp_id"
    return col

def is_link_table(table):
    return table.endswith("_lnk") or table.endswith("_links")

def is_component_table(table):
    return table.endswith("_cmps") or table.endswith("_components")

def is_morph_table(table):
    return "morph" in table or "_mph" in table

def is_main_table(v5_table, v5_cols):
    """Determina si es una tabla principal que necesita draft+published"""
    return (
        "document_id" in v5_cols and
        "published_at" in v5_cols and
        not is_link_table(v5_table) and
        not is_component_table(v5_table) and
        not is_morph_table(v5_table) and
        not v5_table.startswith("strapi_") and
        not v5_table.startswith("admin_") and
        not v5_table.startswith("up_") and
        not v5_table.startswith("upload_") and
        not v5_table.startswith("components_") and
        not v5_table.startswith("i18n_")
    )

def migrate_table(cursor_v4, cursor_v5, v4_table, v5_table):
    """Migra una tabla de v4 a v5"""

    # Verificar que la tabla destino existe
    if not table_exists(cursor_v5, DB_V5, v5_table):
        log(f"  ⚠️  Tabla destino no existe: {v5_table} — SALTANDO", "WARN")
        return 0

    # Verificar que hay datos en origen
    cursor_v4.execute(f"SELECT COUNT(*) FROM `{DB_V4}`.`{v4_table}`")
    count = cursor_v4.fetchone()[0]
    if count == 0:
        log(f"  ⏭️  {v4_table} vacía — saltando")
        return 0

    # Obtener columnas de ambas tablas
    v4_cols = get_columns(cursor_v4, DB_V4, v4_table)
    v5_cols = get_columns(cursor_v5, DB_V5, v5_table)

    # Construir mapeo de columnas v4 → v5
    col_mapping = {}  # v4_col -> v5_col
    for v4_col in v4_cols:
        v5_col = map_column_name(v4_col)
        if v5_col in v5_cols:
            col_mapping[v4_col] = v5_col
        elif v4_col in v5_cols:
            col_mapping[v4_col] = v4_col

    if not col_mapping:
        log(f"  ⚠️  Sin columnas mapeables para {v4_table} — SALTANDO", "WARN")
        return 0

    # Determinar si necesita document_id
    needs_document_id = (
        "document_id" in v5_cols and
        not is_link_table(v5_table) and
        not is_component_table(v5_table) and
        not is_morph_table(v5_table)
    )

    # Determinar si necesita duplicar filas (draft + published)
    needs_draft_published = is_main_table(v5_table, v5_cols)

    # Limpiar tabla destino
    cursor_v5.execute(f"SET FOREIGN_KEY_CHECKS = 0")
    cursor_v5.execute(f"TRUNCATE TABLE `{DB_V5}`.`{v5_table}`")
    cursor_v5.execute(f"SET FOREIGN_KEY_CHECKS = 1")

    # Leer datos de v4
    v4_col_list_no_id = [c for c in col_mapping.keys() if c != "id"]
    v4_col_list = ", ".join(f"`{c}`" for c in v4_col_list_no_id)
    cursor_v4.execute(f"SELECT `id`, {v4_col_list} FROM `{DB_V4}`.`{v4_table}` ORDER BY id")
    rows = cursor_v4.fetchall()

    # Obtener el ID máximo para calcular offset de drafts
    max_id = max(row[0] for row in rows) if rows else 0
    # Los drafts usarán IDs a partir de max_id + 1,000,000 para evitar colisiones
    DRAFT_ID_OFFSET = max_id + 1_000_000

    # Preparar INSERT con id explícito
    v5_col_names = ["id"] + [col_mapping[c] for c in v4_col_list_no_id]
    if needs_document_id:
        v5_col_names_insert = ["document_id"] + v5_col_names
    else:
        v5_col_names_insert = v5_col_names

    placeholders = ", ".join(["%s"] * len(v5_col_names_insert))
    insert_cols = ", ".join(f"`{c}`" for c in v5_col_names_insert)
    sql = f"INSERT INTO `{DB_V5}`.`{v5_table}` ({insert_cols}) VALUES ({placeholders})"

    # Para la fila draft (con id offset, sin published_at)
    if needs_draft_published:
        v5_col_names_draft = ["document_id"] + v5_col_names  # incluye id
        placeholders_draft = ", ".join(["%s"] * len(v5_col_names_draft))
        insert_cols_draft = ", ".join(f"`{c}`" for c in v5_col_names_draft)
        sql_draft = f"INSERT INTO `{DB_V5}`.`{v5_table}` ({insert_cols_draft}) VALUES ({placeholders_draft})"
        published_at_idx = v5_col_names.index("published_at") if "published_at" in v5_col_names else -1

    # Insertar en lotes
    BATCH_SIZE = 500
    inserted = 0
    batch_published = []
    batch_draft = []

    for row in rows:
        original_id = row[0]
        data = list(row[1:])  # sin el id original

        doc_id = str(uuid.uuid4())

        if needs_document_id:
            published_values = [doc_id, original_id] + data
        else:
            published_values = [original_id] + data

        batch_published.append(published_values)

        # Crear fila draft: mismo document_id, id offset, sin published_at
        if needs_draft_published and published_at_idx >= 0:
            draft_id = original_id + DRAFT_ID_OFFSET
            draft_data = data.copy()
            # índice de published_at en data = published_at_idx - 1
            pa_data_idx = published_at_idx - 1
            if pa_data_idx >= 0:
                draft_data[pa_data_idx] = None  # sin published_at = draft
            batch_draft.append([doc_id, draft_id] + draft_data)

    # Insertar TODOS los published primero, luego TODOS los drafts
    cursor_v5.execute(f"SET FOREIGN_KEY_CHECKS = 0")

    # Insertar published en lotes
    for i in range(0, len(batch_published), BATCH_SIZE):
        chunk = batch_published[i:i + BATCH_SIZE]
        cursor_v5.executemany(sql, chunk)
    inserted += len(batch_published)

    # Insertar drafts en lotes (después de todos los published)
    if needs_draft_published and batch_draft:
        for i in range(0, len(batch_draft), BATCH_SIZE):
            chunk = batch_draft[i:i + BATCH_SIZE]
            cursor_v5.executemany(sql_draft, chunk)
        inserted += len(batch_draft)

    cursor_v5.execute(f"SET FOREIGN_KEY_CHECKS = 1")

    if needs_draft_published:
        log(f"  📄 Modo draft+published")

    return inserted

def main():
    log("=" * 60)
    log("Migración Strapi v4 → v5")
    log(f"Origen:  {DB_V4}")
    log(f"Destino: {DB_V5}")
    log("=" * 60)

    # Conectar
    try:
        conn = mysql.connector.connect(
            host=DB_HOST, user=DB_USER, password=DB_PASSWORD,
            database=DB_V4, charset="utf8mb4"
        )
        cursor_v4 = conn.cursor()
        cursor_v5 = conn.cursor()
        log("Conexión establecida ✅")
    except Exception as e:
        log(f"Error de conexión: {e}", "ERROR")
        sys.exit(1)

    # Cambiar base de datos para cursor v5
    cursor_v5.execute(f"USE `{DB_V5}`")

    # Obtener tablas de v4
    v4_tables = get_v4_tables(cursor_v4)
    log(f"Tablas encontradas en v4: {len(v4_tables)}")

    # Separar tablas principales, de relaciones y de componentes
    # Orden de migración: primero principales, luego relaciones y componentes
    main_tables = []
    link_tables = []
    component_tables = []
    other_tables = []

    for t in v4_tables:
        if t in SKIP_TABLES:
            continue
        v5_t = map_table_name(t)
        if is_link_table(t):
            link_tables.append((t, v5_t))
        elif is_component_table(t):
            component_tables.append((t, v5_t))
        elif is_morph_table(t):
            other_tables.append((t, v5_t))
        else:
            main_tables.append((t, v5_t))

    ordered = main_tables + link_tables + component_tables + other_tables
    log(f"Tablas a migrar: {len(ordered)} ({len(main_tables)} principales, {len(link_tables)} relaciones, {len(component_tables)} componentes)")
    log("")

    # Migrar
    results = {"ok": 0, "skipped": 0, "error": 0, "total_rows": 0}

    for v4_table, v5_table in ordered:
        log(f"→ {v4_table} → {v5_table}")
        try:
            inserted = migrate_table(cursor_v4, cursor_v5, v4_table, v5_table)
            conn.commit()
            if inserted > 0:
                log(f"  ✅ {inserted} filas migradas")
                results["ok"] += 1
                results["total_rows"] += inserted
            else:
                results["skipped"] += 1
        except Exception as e:
            conn.rollback()
            log(f"  ❌ Error: {e}", "ERROR")
            results["error"] += 1

    # ─────────────────────────────────────────────────────────
    # Duplicar relaciones para filas draft
    # Las tablas _lnk apuntan al ID original (published).
    # Los drafts tienen ID = original + DRAFT_ID_OFFSET.
    # Necesitamos duplicar cada relación apuntando al ID del draft.
    # ─────────────────────────────────────────────────────────
    log("")
    log("=" * 60)
    log("Duplicando relaciones para drafts...")
    log("=" * 60)

    draft_results = {"ok": 0, "skipped": 0, "error": 0, "total_rows": 0}

    for v4_table, v5_table in link_tables:
        # Solo tablas que tienen una columna que apunta a una tabla principal con drafts
        # Detectamos cuál es la columna "owner" (la que no es el lado inverso)
        try:
            v5_cols = get_columns(cursor_v5, DB_V5, v5_table)

            # Buscar columnas _id en la tabla de relaciones
            id_cols = [c for c in v5_cols if c.endswith('_id') and c != 'id']
            if not id_cols:
                draft_results["skipped"] += 1
                continue

            # Para cada columna _id, verificar si la tabla principal tiene drafts
            # (es decir, si tiene filas con ID > 1,000,000)
            for owner_col in id_cols:
                # Verificar que hay datos
                cursor_v5.execute(f"SELECT COUNT(*) FROM `{DB_V5}`.`{v5_table}`")
                count = cursor_v5.fetchone()[0]
                if count == 0:
                    continue

                # Verificar si hay drafts en la tabla referenciada
                # Los drafts tienen IDs altos (> 100000)
                cursor_v5.execute(f"""
                    SELECT COUNT(*) FROM `{DB_V5}`.`{v5_table}`
                    WHERE `{owner_col}` > 100000
                """)
                already_has_drafts = cursor_v5.fetchone()[0]
                if already_has_drafts > 0:
                    continue  # Ya tiene relaciones para drafts

                # Insertar relaciones duplicadas para drafts
                # El draft tiene ID = published_id + DRAFT_ID_OFFSET (1,000,000)
                # Necesitamos insertar nuevas filas con owner_col = original + 1,000,000
                other_cols = [c for c in v5_cols if c != 'id' and c != owner_col]

                if other_cols:
                    other_cols_str = ", ".join(f"`{c}`" for c in other_cols)
                    insert_sql = f"""
                        INSERT INTO `{DB_V5}`.`{v5_table}` (`{owner_col}`, {other_cols_str})
                        SELECT `{owner_col}` + 1000000, {other_cols_str}
                        FROM `{DB_V5}`.`{v5_table}`
                        WHERE `{owner_col}` < 100000
                    """
                else:
                    insert_sql = f"""
                        INSERT INTO `{DB_V5}`.`{v5_table}` (`{owner_col}`)
                        SELECT `{owner_col}` + 1000000
                        FROM `{DB_V5}`.`{v5_table}`
                        WHERE `{owner_col}` < 100000
                    """

                cursor_v5.execute(f"SET FOREIGN_KEY_CHECKS = 0")
                cursor_v5.execute(insert_sql)
                inserted = cursor_v5.rowcount
                cursor_v5.execute(f"SET FOREIGN_KEY_CHECKS = 1")
                conn.commit()

                if inserted > 0:
                    log(f"  ✅ {v5_table} ({owner_col}): {inserted} relaciones de draft duplicadas")
                    draft_results["ok"] += 1
                    draft_results["total_rows"] += inserted

        except Exception as e:
            conn.rollback()
            log(f"  ❌ Error en {v5_table}: {e}", "ERROR")
            draft_results["error"] += 1

    # Resumen
    log("")
    log("=" * 60)
    log("RESUMEN DE MIGRACIÓN")
    log("=" * 60)
    log(f"✅ Tablas migradas:  {results['ok']}")
    log(f"⏭️  Tablas saltadas:  {results['skipped']}")
    log(f"❌ Tablas con error: {results['error']}")
    log(f"📊 Total filas:      {results['total_rows']:,}")
    log("")
    log("RELACIONES DRAFT")
    log(f"✅ Tablas procesadas: {draft_results['ok']}")
    log(f"❌ Errores:           {draft_results['error']}")
    log(f"📊 Relaciones draft:  {draft_results['total_rows']:,}")
    log("=" * 60)

    cursor_v4.close()
    cursor_v5.close()
    conn.close()

if __name__ == "__main__":
    main()
