"""
Script: Copiar archivos (media) de published a draft en files_related_mph
=========================================================================
Para cada colección con Draft & Publish, copia las filas de files_related_mph
del registro published al draft equivalente (mismo document_id) cuando
el draft no tiene los archivos.

Uso:
    pip install mysql-connector-python
    python sync_files_to_draft.py

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
DRY_RUN     = False

# Colecciones con Draft & Publish y su related_type en files_related_mph
COLLECTIONS = {
    "abouts":         "api::about.about",
    "authors":        "api::author.author",
    "blogs":          "api::blog.blog",
    "brain_users":    "api::brain-user.brain-user",
    "buyers":         "api::buyer.buyer",
    "buyer_contacts": "api::buyer-contact.buyer-contact",
    "codes":          "api::code.code",
    "commissions":    "api::commission.commission",
    "committees":     "api::committee.committee",
    "continents":     "api::continent.continent",
    "countries":      "api::country.country",
    "docs":           "api::doc.doc",
    "domains":        "api::domain.domain",
    "entities":       "api::entity.entity",
    "entity_types":   "api::entity-type.entity-type",
    "faqs":           "api::faq.faq",
    "glossaries":     "api::glossary.glossary",
    "iminterests":    "api::iminterest.iminterest",
    "interests":      "api::interest.interest",
    "licenses":       "api::license.license",
    "notifications":  "api::notification.notification",
    "opportunities":  "api::opportunity.opportunity",
    "regions":        "api::region.region",
    "regulations":    "api::regulation.regulation",
    "resources":      "api::resource.resource",
    "sectors":        "api::sector.sector",
    "services":       "api::service.service",
    "statistics":     "api::statistic.statistic",
    "subcommittees":  "api::subcommittee.subcommittee",
    "tags":           "api::tag.tag",
    "tradeshows":     "api::tradeshow.tradeshow",
    "webinars":       "api::webinar.webinar",
}

def log(msg, level="INFO"):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] [{level}] {msg}")

def sync_collection(cursor, conn, table, related_type):
    """
    Para una colección, copia archivos del published al draft.
    """
    # Contar archivos faltantes en draft
    cursor.execute(f"""
        SELECT COUNT(*)
        FROM `{DB_NAME}`.`files_related_mph` mph
        JOIN `{DB_NAME}`.`{table}` pub 
            ON pub.id = mph.related_id 
            AND pub.published_at IS NOT NULL
        JOIN `{DB_NAME}`.`{table}` draft 
            ON draft.document_id = pub.document_id 
            AND draft.published_at IS NULL
        WHERE mph.related_type = '{related_type}'
        AND NOT EXISTS (
            SELECT 1 FROM `{DB_NAME}`.`files_related_mph` mph2
            WHERE mph2.related_id = draft.id
            AND mph2.file_id = mph.file_id
            AND mph2.field = mph.field
            AND mph2.related_type = mph.related_type
        )
    """)
    missing = cursor.fetchone()[0]

    if missing == 0:
        return 0, 0

    inserted = 0
    if not DRY_RUN:
        cursor.execute(f"""
            INSERT IGNORE INTO `{DB_NAME}`.`files_related_mph` 
                (file_id, related_id, related_type, field, `order`)
            SELECT mph.file_id, draft.id, mph.related_type, mph.field, mph.`order`
            FROM `{DB_NAME}`.`files_related_mph` mph
            JOIN `{DB_NAME}`.`{table}` pub 
                ON pub.id = mph.related_id 
                AND pub.published_at IS NOT NULL
            JOIN `{DB_NAME}`.`{table}` draft 
                ON draft.document_id = pub.document_id 
                AND draft.published_at IS NULL
            WHERE mph.related_type = '{related_type}'
            AND NOT EXISTS (
                SELECT 1 FROM `{DB_NAME}`.`files_related_mph` mph2
                WHERE mph2.related_id = draft.id
                AND mph2.file_id = mph.file_id
                AND mph2.field = mph.field
                AND mph2.related_type = mph.related_type
            )
        """)
        inserted = cursor.rowcount
        conn.commit()

    return missing, inserted

def main():
    log("=" * 60)
    log(f"Sincronización de archivos published → draft")
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

    log("")
    total_missing = 0
    total_inserted = 0
    tables_ok = 0
    tables_with_issues = 0

    for table, related_type in COLLECTIONS.items():
        try:
            missing, inserted = sync_collection(cursor, conn, table, related_type)

            if missing > 0:
                tables_with_issues += 1
                total_missing += missing
                total_inserted += inserted
                if DRY_RUN:
                    log(f"  ⚠️  {table} ({related_type}) — {missing} archivos faltantes en draft")
                else:
                    log(f"  ✅ {table} ({related_type}) — {missing} faltantes, {inserted} insertados")
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
    log(f"Colecciones OK:                {tables_ok}")
    log(f"Colecciones con faltantes:     {tables_with_issues}")
    log(f"Total archivos faltantes:      {total_missing:,}")
    if not DRY_RUN:
        log(f"Total archivos insertados:     {total_inserted:,}")
    log("=" * 60)

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
