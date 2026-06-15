"""
Script: Sincronizar relaciones de published a draft en tablas _lnk de Strapi v5
================================================================================
Para cada tabla _lnk:
1. ELIMINA filas del draft donde target apunta a published (si ya existe la correcta)
2. ACTUALIZA filas del draft donde target apunta a published (si no existe duplicado)
3. INSERTA relaciones faltantes en draft copiando las del published

Uso:
    pip install mysql-connector-python
    python sync_published_to_draft.py

DRY_RUN = True  → solo reporta, no modifica nada
DRY_RUN = False → aplica los cambios
"""

import mysql.connector
import sys
from datetime import datetime

DB_HOST     = "35.223.43.203"
DB_USER     = "william"
DB_PASSWORD = "Amil@m1a20"
DB_NAME     = "brainstrapi5"
DRY_RUN     = False

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

def get_base_table(col_name):
    base = col_name[:-3]
    for variant in [base, base + 's', base + 'es']:
        if variant in DRAFT_PUBLISH_TABLES:
            return variant
    return None

def identify_owner(table, id_cols):
    table_base = table.replace('_lnk', '')
    for col in id_cols:
        base = get_base_table(col)
        if not base:
            continue
        if table_base.startswith(base) or table_base.endswith(base):
            return col, base
    for col in id_cols:
        base = get_base_table(col)
        if base:
            return col, base
    return None, None

def sync_table(cursor, conn, table):
    cols = get_columns(cursor, table)
    id_cols = [row[0] for row in cols if row[0].endswith('_id') and row[0] != 'id']
    all_cols = [row[0] for row in cols if row[0] != 'id']

    if not id_cols:
        return 0, 0, 0, 0

    owner_col, owner_table = identify_owner(table, id_cols)
    if not owner_col or not owner_table:
        return 0, 0, 0, 0

    other_cols = [c for c in all_cols if c != owner_col]
    if not other_cols:
        return 0, 0, 0, 0

    target_cols_with_draft = {}
    target_cols_without_draft = []

    for col in other_cols:
        if col.endswith('_id'):
            base = get_base_table(col)
            if base:
                target_cols_with_draft[col] = base
            else:
                target_cols_without_draft.append(col)
        else:
            target_cols_without_draft.append(col)

    to_correct = 0
    corrected = 0

    # ─────────────────────────────────────────────────────
    # PASO 1: Corregir filas donde draft owner → published target
    # ─────────────────────────────────────────────────────
    for target_col, target_table in target_cols_with_draft.items():
        cursor.execute(f"""
            SELECT COUNT(*)
            FROM `{DB_NAME}`.`{table}` lnk
            JOIN `{DB_NAME}`.`{owner_table}` owner_draft 
                ON owner_draft.id = lnk.`{owner_col}` 
                AND owner_draft.published_at IS NULL
            JOIN `{DB_NAME}`.`{target_table}` target_pub 
                ON target_pub.id = lnk.`{target_col}` 
                AND target_pub.published_at IS NOT NULL
            JOIN `{DB_NAME}`.`{target_table}` target_draft 
                ON target_draft.document_id = target_pub.document_id 
                AND target_draft.published_at IS NULL
        """)
        count = cursor.fetchone()[0]
        to_correct += count

        if count > 0 and not DRY_RUN:
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")

            # Caso A: Ya existe fila correcta → DELETE la incorrecta
            # Usamos subquery en tabla temporal para evitar error 1093
            cursor.execute(f"""
                DELETE FROM `{DB_NAME}`.`{table}`
                WHERE id IN (
                    SELECT id FROM (
                        SELECT lnk.id
                        FROM `{DB_NAME}`.`{table}` lnk
                        JOIN `{DB_NAME}`.`{owner_table}` owner_draft 
                            ON owner_draft.id = lnk.`{owner_col}` 
                            AND owner_draft.published_at IS NULL
                        JOIN `{DB_NAME}`.`{target_table}` target_pub 
                            ON target_pub.id = lnk.`{target_col}` 
                            AND target_pub.published_at IS NOT NULL
                        JOIN `{DB_NAME}`.`{target_table}` target_draft 
                            ON target_draft.document_id = target_pub.document_id 
                            AND target_draft.published_at IS NULL
                        WHERE EXISTS (
                            SELECT 1 FROM `{DB_NAME}`.`{table}` lnk2
                            WHERE lnk2.`{owner_col}` = lnk.`{owner_col}`
                            AND lnk2.`{target_col}` = target_draft.id
                        )
                    ) AS tmp
                )
            """)
            deleted = cursor.rowcount
            corrected += deleted

            # Caso B: No existe fila correcta → UPDATE al draft del target
            cursor.execute(f"""
                UPDATE `{DB_NAME}`.`{table}` lnk
                JOIN `{DB_NAME}`.`{owner_table}` owner_draft 
                    ON owner_draft.id = lnk.`{owner_col}` 
                    AND owner_draft.published_at IS NULL
                JOIN `{DB_NAME}`.`{target_table}` target_pub 
                    ON target_pub.id = lnk.`{target_col}` 
                    AND target_pub.published_at IS NOT NULL
                JOIN `{DB_NAME}`.`{target_table}` target_draft 
                    ON target_draft.document_id = target_pub.document_id 
                    AND target_draft.published_at IS NULL
                SET lnk.`{target_col}` = target_draft.id
                WHERE NOT EXISTS (
                    SELECT 1 FROM (
                        SELECT 1 FROM `{DB_NAME}`.`{table}` lnk2
                        WHERE lnk2.`{owner_col}` = lnk.`{owner_col}`
                        AND lnk2.`{target_col}` = target_draft.id
                    ) AS tmp
                )
            """)
            updated = cursor.rowcount
            corrected += updated

            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            conn.commit()

    # ─────────────────────────────────────────────────────
    # PASO 2: INSERTAR relaciones faltantes en draft
    # ─────────────────────────────────────────────────────
    select_parts = []
    join_parts = []
    join_alias_idx = 0

    for col in other_cols:
        if col in target_cols_with_draft:
            base = target_cols_with_draft[col]
            alias_pub = f"tpub{join_alias_idx}"
            alias_draft = f"tdraft{join_alias_idx}"
            join_parts.append(f"""
                LEFT JOIN `{DB_NAME}`.`{base}` {alias_pub} 
                    ON {alias_pub}.id = lnk.`{col}` AND {alias_pub}.published_at IS NOT NULL
                LEFT JOIN `{DB_NAME}`.`{base}` {alias_draft} 
                    ON {alias_draft}.document_id = {alias_pub}.document_id 
                    AND {alias_draft}.published_at IS NULL
            """)
            select_parts.append(f"COALESCE({alias_draft}.id, lnk.`{col}`) as `{col}`")
            join_alias_idx += 1
        else:
            select_parts.append(f"lnk.`{col}`")

    select_str = ", ".join(select_parts)
    join_str = " ".join(join_parts)
    other_cols_insert = ", ".join(f"`{c}`" for c in other_cols)
    non_ord_other = [c for c in other_cols if not c.endswith('_ord') and c.endswith('_id')]

    if non_ord_other:
        where_not_exists = ' AND '.join(f'lnk2.`{c}` = lnk.`{c}`' for c in non_ord_other)
    else:
        where_not_exists = '1=0'

    cursor.execute(f"""
        SELECT COUNT(*)
        FROM `{DB_NAME}`.`{table}` lnk
        JOIN `{DB_NAME}`.`{owner_table}` pub 
            ON pub.id = lnk.`{owner_col}` 
            AND pub.published_at IS NOT NULL
        JOIN `{DB_NAME}`.`{owner_table}` draft_owner 
            ON draft_owner.document_id = pub.document_id 
            AND draft_owner.published_at IS NULL
        {join_str}
        WHERE NOT EXISTS (
            SELECT 1 FROM `{DB_NAME}`.`{table}` lnk2
            WHERE lnk2.`{owner_col}` = draft_owner.id
            AND {where_not_exists}
        )
    """)
    to_insert = cursor.fetchone()[0]
    inserted = 0

    if to_insert > 0 and not DRY_RUN:
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        cursor.execute(f"""
            INSERT IGNORE INTO `{DB_NAME}`.`{table}` (`{owner_col}`, {other_cols_insert})
            SELECT draft_owner.id, {select_str}
            FROM `{DB_NAME}`.`{table}` lnk
            JOIN `{DB_NAME}`.`{owner_table}` pub 
                ON pub.id = lnk.`{owner_col}` 
                AND pub.published_at IS NOT NULL
            JOIN `{DB_NAME}`.`{owner_table}` draft_owner 
                ON draft_owner.document_id = pub.document_id 
                AND draft_owner.published_at IS NULL
            {join_str}
            WHERE NOT EXISTS (
                SELECT 1 FROM `{DB_NAME}`.`{table}` lnk2
                WHERE lnk2.`{owner_col}` = draft_owner.id
                AND {where_not_exists}
            )
        """)
        inserted = cursor.rowcount
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        conn.commit()

    return to_correct, corrected, to_insert, inserted

def main():
    log("=" * 60)
    log(f"Sincronización published → draft en tablas _lnk")
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

    total_to_correct = 0
    total_corrected = 0
    total_to_insert = 0
    total_inserted = 0
    tables_ok = 0
    tables_with_issues = 0
    tables_skipped = 0

    for table in lnk_tables:
        if table in SKIP_TABLES:
            tables_skipped += 1
            continue

        try:
            to_correct, corrected, to_insert, inserted = sync_table(cursor, conn, table)

            if to_correct > 0 or to_insert > 0:
                tables_with_issues += 1
                total_to_correct += to_correct
                total_corrected += corrected
                total_to_insert += to_insert
                total_inserted += inserted

                if DRY_RUN:
                    msg_parts = []
                    if to_correct > 0:
                        msg_parts.append(f"{to_correct} a corregir")
                    if to_insert > 0:
                        msg_parts.append(f"{to_insert} a insertar")
                    log(f"  ⚠️  {table} — {', '.join(msg_parts)}")
                else:
                    msg_parts = []
                    if corrected > 0:
                        msg_parts.append(f"{corrected} corregidas")
                    if inserted > 0:
                        msg_parts.append(f"{inserted} insertadas")
                    log(f"  ✅ {table} — {', '.join(msg_parts)}")
            else:
                tables_ok += 1
                log(f"  ✓  {table} — OK")

        except Exception as e:
            conn.rollback()
            log(f"  ❌ {table} — Error: {e}", "ERROR")
            tables_skipped += 1

    log("")
    log("=" * 60)
    log("RESUMEN")
    log("=" * 60)
    log(f"Tablas OK:                     {tables_ok}")
    log(f"Tablas con cambios:            {tables_with_issues}")
    log(f"Tablas saltadas/error:         {tables_skipped}")
    log(f"Relaciones a corregir:         {total_to_correct:,}")
    log(f"Relaciones a insertar:         {total_to_insert:,}")
    if not DRY_RUN:
        log(f"Relaciones corregidas:         {total_corrected:,}")
        log(f"Relaciones insertadas:         {total_inserted:,}")
    log("=" * 60)

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
