"""
================================================================================
SUPERMARKET CHAIN MANAGEMENT SYSTEM (ICT3222 ADBMS)
Member 4: Big Data Synthetic Seed Generator (50,000+ Orders)
================================================================================
Generates 50,000+ realistic completed sales orders across 2 years (2025-2026)
to demonstrate authentic MySQL 8.0 `EXPLAIN ANALYZE` benchmarks,
index range scans, and partition pruning for Member 4 coursework.
"""

import random
from datetime import datetime, timedelta

NUM_ORDERS = 50000
OUTPUT_FILE = "database/seed_bulk/seed_50k_orders.sql"

BRANCH_IDS = [1, 2, 3, 4]
EMPLOYEE_IDS = [1, 2, 3, 4, 5]
CUSTOMER_IDS = list(range(1, 100)) + [None] * 20  # 80% loyalty shoppers, 20% walk-in
PRODUCT_PRICES = {
    1: 5.40, 2: 14.50, 3: 8.20, 4: 2.10, 5: 3.50,
    6: 12.00, 7: 6.80, 8: 19.50, 9: 14.00, 10: 3.80,
    11: 8.90, 12: 4.50, 13: 2.50, 14: 1.80, 15: 7.20
}

def generate_bulk_sql():
    print(f"Generating {NUM_ORDERS} sales orders for Member 4 EXPLAIN benchmark...")
    
    start_date = datetime(2025, 1, 1)
    end_date = datetime(2026, 10, 20)
    delta_days = (end_date - start_date).days

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("-- ============================================================================\n")
        f.write("-- 50,000+ BULK ORDERS DATASET FOR EXPLAIN ANALYZE & PARTITIONING PROOF\n")
        f.write("-- Supermarket Chain ADBMS - Member 4\n")
        f.write("-- ============================================================================\n")
        f.write("USE supermarket_db;\n")
        f.write("SET FOREIGN_KEY_CHECKS = 0;\n\n")

        batch_size = 1000
        order_items_batch = []
        orders_batch = []

        for order_id in range(1, NUM_ORDERS + 1):
            branch_id = random.choice(BRANCH_IDS)
            cust_id = random.choice(CUSTOMER_IDS)
            emp_id = random.choice(EMPLOYEE_IDS)
            
            random_day = start_date + timedelta(days=random.randint(0, delta_days),
                                                hours=random.randint(8, 21),
                                                minutes=random.randint(0, 59),
                                                seconds=random.randint(0, 59))
            date_str = random_day.strftime("%Y-%m-%d %H:%M:%S")

            # 1 to 5 random products per order
            num_items = random.randint(1, 4)
            chosen_products = random.sample(list(PRODUCT_PRICES.keys()), num_items)
            
            subtotal = 0.0
            for prod_id in chosen_products:
                qty = random.randint(1, 5)
                unit_price = PRODUCT_PRICES[prod_id]
                subtotal += (qty * unit_price)
                order_items_batch.append(f"({order_id}, {prod_id}, {qty}, {unit_price:.2f})")

            discount = round(subtotal * 0.10, 2) if random.random() < 0.25 else 0.00
            total_amount = round(subtotal - discount, 2)
            cust_val = f"{cust_id}" if cust_id else "NULL"

            orders_batch.append(
                f"({order_id}, {branch_id}, {cust_val}, {emp_id}, '{date_str}', 'COMPLETED', {subtotal:.2f}, {discount:.2f}, {total_amount:.2f})"
            )

            if len(orders_batch) >= batch_size:
                f.write("INSERT INTO sales_order (order_id, branch_id, customer_id, employee_id, order_date, status, subtotal, discount_total, total_amount) VALUES\n")
                f.write(",\n".join(orders_batch) + ";\n\n")
                orders_batch = []

                f.write("INSERT INTO order_item (order_id, product_id, quantity, unit_price) VALUES\n")
                f.write(",\n".join(order_items_batch) + ";\n\n")
                order_items_batch = []

        if orders_batch:
            f.write("INSERT INTO sales_order (order_id, branch_id, customer_id, employee_id, order_date, status, subtotal, discount_total, total_amount) VALUES\n")
            f.write(",\n".join(orders_batch) + ";\n\n")
            f.write("INSERT INTO order_item (order_id, product_id, quantity, unit_price) VALUES\n")
            f.write(",\n".join(order_items_batch) + ";\n\n")

        f.write("SET FOREIGN_KEY_CHECKS = 1;\n")
        f.write("-- Bulk generation complete.\n")

    print(f"Generated {NUM_ORDERS} orders into {OUTPUT_FILE} successfully.")

if __name__ == "__main__":
    generate_bulk_sql()
