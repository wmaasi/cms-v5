"""
Script: Reparar relaciones rotas en tablas _lnk de Strapi v5
=============================================================
Para cada tabla _lnk, encuentra filas donde el target_id no existe
y las corrige apuntando al draft real del mismo document_id.

Estrategia:
1. Elimina las filas rotas
2. Inserta las correctas con INSERT IGNORE

Uso:
    pip install mysql-connector-python
    python fix_broken_relations.py

DRY_RUN = True  → solo reporta, no modifica nada
DRY_RUN = False → aplica los cambios
"""

import mysql.connector
import sys
from datetime import datetime

# ─────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────
DB_HOST     = "35.223.43.203"
DB_USER     = "william"
DB_PASSWORD = "Amil@m1a20"
DB_NAME     = "brainstrapi5"
DRY_RUN     = True

# ─────────────────────────────────────────────────────────
# Tablas a ignorar
# ─────────────────────────────────────────────────────────
SKIP_TABLES = {
    "files_folder_lnk", "files_related_mph", "upload_folders_parent_lnk",
    "strapi_release_actions_release_lnk", "strapi_workflows_stage_required_to_publish_lnk",
    "strapi_workflows_stages_workflow_lnk", "strapi_workflows_stages_permissions_lnk",
    "up_permissions_role_lnk", "up_users_role_lnk", "admin_permissions_role_lnk",
    "admin_permissions_api_token_lnk", "admin_users_roles_lnk",
    "strapi_api_tokens_admin_user_owner_lnk", "strapi_api_token_permissions_token_lnk",
    "strapi_transfer_token_permissions_token_lnk",
}

DRAFT_PUBLISH_TABLES = {
    "abouts", "authors", "blogs", "brain_users", "buyers", "buyer_contacts",
    "categories", "codes", "commissions", "committees", "continents", "countries",
    "docs", "domains", "entities", "entity_types", "faqs", "globals", "glossaries",
    "iminterests", "interests", "licenses", "notifications", "opportunities",
    "regions", "regulations", "resources", "sectors", "services", "statistics",
    "subcommittees", "tags", "tradeshows", "webinars",
}

def log(msg, level="INFO"):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] [{level}] {msg}")

def get_lnk_tables(cursor):
    cursor.execute(f"""
        SELECT TABLE_NAME FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = '{DB_NAME}'
        AND TABLE_NAME LIKE '%_lnk'
        AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
    """)
    return [row[0] for row in cursor.fetchall()]

def get_columns(cursor, table):
    cursor.execute(f"DESCRIBE `{DB_NAME}`.`{table}`")
    return cursor.fetchall()

def get_id_columns(cursor, table):
    cols = get_columns(cursor, table)
    return [row[0] for row in cols if row[0].endswith('_id') and row[0] != 'id']

def get_all_columns(cursor, table):
    cols = get_columns(cursor, table)
    return [row[0] for row in cols if row[0] != 'id']

def get_base_table(col_name):
    base = col_name[:-3]
    for variant in [base, base + 's', base + 'es']:
        if variant in DRAFT_PUBLISH_TABLES:
            return variant
    return None

def fix_column(cursor, conn, table, col, base_table, all_cols):
    """
    Para una columna rota en una tabla _lnk:
    1. Cuenta filas rotas
    2. En modo real: DELETE las rotas + INSERT IGNORE las correctas
    """
    # Contar filas rotas
    cursor.execute(f"""
        SELECT COUNT(*) FROM `{DB_NAME}`.`{table}` t
        WHERE NOT EXISTS (
            SELECT 1 FROM `{DB_NAME}`.`{base_table}` b WHERE b.id = t.`{col}`
        )
    """)
    broken_count = cursor.fetchone()[0]

    if broken_count == 0:
        return 0, 0, 0

    # Contar reparables (tienen original y draft real)
    cursor.execute(f"""
        SELECT COUNT(*) FROM `{DB_NAME}`.`{table}` t
        JOIN `{DB_NAME}`.`{base_table}` original 
            ON original.id = CAST(t.`{col}` AS SIGNED) - 1000000
        JOIN `{DB_NAME}`.`{base_table}` draft 
            ON draft.document_id = original.document_id 
            AND draft.published_at IS NULL
        WHERE NOT EXISTS (
            SELECT 1 FROM `{DB_NAME}`.`{base_table}` b WHERE b.id = t.`{col}`
        )
    """)
    fixable_count = cursor.fetchone()[0]
    unfixable_count = broken_count - fixable_count

    if DRY_RUN:
        return broken_count, fixable_count, unfixable_count

    cursor.execute("SET FOREIGN_KEY_CHECKS = 0")

    # Otras columnas para reconstruir la fila
    other_cols = [c for c in all_cols if c != col]
    other_cols_select = ", ".join(f"t.`{c}`" for c in other_cols)
    other_cols_insert = ", ".join(f"`{c}`" for c in other_cols)

    # Paso 1: Guardar las filas correctas en memoria temporal
    # Paso 2: DELETE las rotas
    cursor.execute(f"""
        DELETE t FROM `{DB_NAME}`.`{table}` t
        WHERE NOT EXISTS (
            SELECT 1 FROM `{DB_NAME}`.`{base_table}` b WHERE b.id = t.`{col}`
        )
    """)
    deleted = cursor.rowcount

    # Paso 3: INSERT IGNORE con el draft_real_id correcto
    if fixable_count > 0 and other_cols:
        cursor.execute(f"""
            INSERT IGNORE INTO `{DB_NAME}`.`{table}` (`{col}`, {other_cols_insert})
            SELECT draft.id, {other_cols_select}
            FROM `{DB_NAME}`.`{table}` t
            JOIN `{DB_NAME}`.`{base_table}` original 
                ON original.id = CAST(t.`{col}` AS SIGNED) - 1000000
            JOIN `{DB_NAME}`.`{base_table}` draft 
                ON draft.document_id = original.document_id 
                AND draft.published_at IS NULL
            WHERE NOT EXISTS (
                SELECT 1 FROM `{DB_NAME}`.`{base_table}` b WHERE b.id = t.`{col}`
            )
        """)

    cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
    conn.commit()

    return broken_count, fixable_count, unfixable_count

def main():
    log("=" * 60)
    log(f"Reparación de relaciones rotas en tablas _lnk")
    log(f"Modo: {'DRY RUN (sin cambios)' if DRY_RUN else '🔥 EN VIVO (escribe en DB)'}")
    log("=" * 60)

    try:
        conn = mysql.connector.connect(
            host=DB_HOST, user=DB_USER, password=DB_PASSWORD,
            database=DB_NAME, charset="utf8mb4"
        )
        cursor = conn.cursor()
        log("Conexión establecida ✅")
    except Exception as e:
        log(f"Error de conexión: {e}", "ERROR")
        sys.exit(1)

    lnk_tables = get_lnk_tables(cursor)
    log(f"Tablas _lnk encontradas: {len(lnk_tables)}")
    log("")

    total_broken = 0
    total_fixable = 0
    total_unfixable = 0
    unfixable_list = []

    for table in lnk_tables:
        if table in SKIP_TABLES:
            continue

        try:
            id_cols = get_id_columns(cursor, table)
            all_cols = get_all_columns(cursor, table)

            for col in id_cols:
                base_table = get_base_table(col)
                if not base_table:
                    continue

                broken, fixable, unfixable = fix_column(cursor, conn, table, col, base_table, all_cols)

                if broken > 0:
                    total_broken += broken
                    total_fixable += fixable
                    total_unfixable += unfixable

                    if DRY_RUN:
                        log(f"  ⚠️  {table}.{col} → {broken} rotas ({fixable} reparables, {unfixable} sin solución)")
                    else:
                        log(f"  ✅ {table}.{col} → {broken} rotas, {fixable} reparadas, {unfixable} sin solución")

                    if unfixable > 0:
                        unfixable_list.append((table, col, unfixable, base_table))

        except Exception as e:
            conn.rollback()
            log(f"  ❌ {table} — Error: {e}", "ERROR")

    log("")
    log("=" * 60)
    log("RESUMEN")
    log("=" * 60)
    log(f"Total relaciones rotas:              {total_broken:,}")
    log(f"Reparables automáticamente:          {total_fixable:,}")
    log(f"Sin solución automática:             {total_unfixable:,}")

    if unfixable_list:
        log("")
        log("Sin solución automática:")
        for table, col, count, base_table in unfixable_list:
            log(f"  - {table}.{col} → {count} filas sin {base_table} origen")

    log("=" * 60)

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
