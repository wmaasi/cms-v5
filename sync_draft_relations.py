"""
Script: Sincronizar relaciones de draft con published en Strapi v5
==================================================================
Para cada tabla _lnk, copia las relaciones del published al draft
cuando el draft no las tiene.

Uso:
    pip install mysql-connector-python
    python sync_draft_relations.py

El script opera en modo DRY_RUN por defecto.
Cambia DRY_RUN = False para aplicar los cambios.
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
DRY_RUN     = True  # Cambia a False para aplicar cambios reales
DRAFT_OFFSET = 1_000_000  # Los drafts tienen ID = published_id + DRAFT_OFFSET

# ─────────────────────────────────────────────────────────
# Tablas a IGNORAR (no tienen owner con draft/published)
# ─────────────────────────────────────────────────────────
SKIP_TABLES = {
    "files_folder_lnk",
    "files_related_mph",
    "upload_folders_parent_lnk",
    "strapi_release_actions_release_lnk",
    "strapi_workflows_stage_required_to_publish_lnk",
    "strapi_workflows_stages_workflow_lnk",
    "strapi_workflows_stages_permissions_lnk",
    "up_permissions_role_lnk",
    "up_users_role_lnk",
    "admin_permissions_role_lnk",
    "admin_permissions_api_token_lnk",
    "admin_users_roles_lnk",
    "strapi_api_tokens_admin_user_owner_lnk",
    "strapi_api_token_permissions_token_lnk",
    "strapi_transfer_token_permissions_token_lnk",
}

# ─────────────────────────────────────────────────────────
# Colecciones que tienen Draft & Publish activo
# (sus IDs pueden tener versión draft = id + DRAFT_OFFSET)
# ─────────────────────────────────────────────────────────
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
    return [(row[0], row[1]) for row in cursor.fetchall()]

def identify_owner_column(table, columns):
    """
    Identifica cuál columna es el 'owner' (la que pertenece a una tabla
    con Draft & Publish). El owner tendrá IDs altos (drafts = id + DRAFT_OFFSET).
    """
    id_cols = [col for col, typ in columns if col.endswith('_id') and col != 'id']
    
    owner_candidates = []
    for col in id_cols:
        # El nombre de la columna sin _id debería corresponder a una tabla principal
        # Ej: doc_id -> docs, brain_user_id -> brain_users, commission_id -> commissions
        base = col[:-3]  # quitar _id
        # Intentar variaciones: base, base+'s', base+'es'
        for variant in [base, base + 's', base + 'es', base.replace('_', '') + 's']:
            if variant in DRAFT_PUBLISH_TABLES:
                owner_candidates.append(col)
                break
    
    return owner_candidates

def sync_table(cursor, table):
    """
    Para una tabla _lnk, encuentra filas del published que no tienen
    equivalente en draft y las crea.
    """
    columns = get_columns(cursor, table)
    col_names = [col for col, typ in columns if col != 'id']
    
    owner_candidates = identify_owner_column(table, columns)
    
    if not owner_candidates:
        return 0, 0, "sin_owner"
    
    total_inserted = 0
    total_missing = 0
    
    for owner_col in owner_candidates:
        # Columnas que no son el owner ni el id
        other_cols = [c for c in col_names if c != owner_col]
        
        if not other_cols:
            continue
        
        # Encontrar filas published sin su equivalente draft
        other_cols_str = ", ".join(f"`pub`.`{c}`" for c in other_cols)
        other_cols_insert = ", ".join(f"`{c}`" for c in other_cols)
        
        # Verificar cuántas faltan
        cursor.execute(f"""
            SELECT COUNT(*) FROM `{DB_NAME}`.`{table}` pub
            WHERE pub.`{owner_col}` < 100000
            AND NOT EXISTS (
                SELECT 1 FROM `{DB_NAME}`.`{table}` draft
                WHERE draft.`{owner_col}` = pub.`{owner_col}` + {DRAFT_OFFSET}
                AND {' AND '.join(f'draft.`{c}` = pub.`{c}`' for c in other_cols if not c.endswith('_ord'))}
            )
        """)
        missing = cursor.fetchone()[0]
        total_missing += missing
        
        if missing == 0:
            continue
            
        if not DRY_RUN:
            # Insertar las relaciones faltantes para el draft
            cursor.execute(f"SET FOREIGN_KEY_CHECKS = 0")
            cursor.execute(f"""
                INSERT IGNORE INTO `{DB_NAME}`.`{table}` (`{owner_col}`, {other_cols_insert})
                SELECT pub.`{owner_col}` + {DRAFT_OFFSET}, {other_cols_str}
                FROM `{DB_NAME}`.`{table}` pub
                WHERE pub.`{owner_col}` < 100000
                AND NOT EXISTS (
                    SELECT 1 FROM `{DB_NAME}`.`{table}` draft
                    WHERE draft.`{owner_col}` = pub.`{owner_col}` + {DRAFT_OFFSET}
                    AND {' AND '.join(f'draft.`{c}` = pub.`{c}`' for c in other_cols if not c.endswith('_ord'))}
                )
            """)
            inserted = cursor.rowcount
            cursor.execute(f"SET FOREIGN_KEY_CHECKS = 1")
            total_inserted += inserted
    
    return total_missing, total_inserted, "ok"

def main():
    log("=" * 60)
    log(f"Sincronización de relaciones draft ← published")
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

    total_missing = 0
    total_inserted = 0
    tables_with_issues = 0
    tables_ok = 0
    tables_skipped = 0

    for table in lnk_tables:
        if table in SKIP_TABLES:
            tables_skipped += 1
            continue

        try:
            missing, inserted, status = sync_table(cursor, table)
            
            if status == "sin_owner":
                log(f"  ⏭️  {table} — sin owner identificado, saltando")
                tables_skipped += 1
                continue
            
            if missing > 0:
                tables_with_issues += 1
                total_missing += missing
                total_inserted += inserted
                if DRY_RUN:
                    log(f"  ⚠️  {table} — {missing} relaciones de draft faltantes")
                else:
                    log(f"  ✅ {table} — {missing} faltantes, {inserted} insertadas")
                conn.commit()
            else:
                tables_ok += 1
                log(f"  ✓  {table} — OK")
                
        except Exception as e:
            conn.rollback()
            log(f"  ❌ {table} — Error: {e}", "ERROR")

    log("")
    log("=" * 60)
    log("RESUMEN")
    log("=" * 60)
    log(f"Tablas OK (sin faltantes):     {tables_ok}")
    log(f"Tablas con faltantes:          {tables_with_issues}")
    log(f"Tablas saltadas:               {tables_skipped}")
    log(f"Total relaciones faltantes:    {total_missing:,}")
    if not DRY_RUN:
        log(f"Total relaciones insertadas:   {total_inserted:,}")
    log("=" * 60)

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
