from fastapi import FastAPI, Request
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import certifi
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json
from bson.objectid import ObjectId
from datetime import datetime

app = FastAPI()
load_dotenv()

mongo_uri = "mongodb+srv://shayelisha2312:9wbd9bNWOQqBTA2m@nexora.396qf.mongodb.net/Nexora?retryWrites=true&w=majority&appName=Nexora"
client = MongoClient(mongo_uri, tls=True, tlsCAFile=certifi.where())
db = client["Nexora"]

print("Collections in Nexora database:", db.list_collection_names())

documents = []
answers = {}

def load_data_to_documents(company_id):
    """טוען את כל המסמכים מהקולקשנים למערך documents"""
    global documents
    documents.clear()
    collections = [
        "budgets", "customerorders", "customers", "departments", "employees", "events",
        "finances", "inventories", "payments", "performancereviews", "procurements",
        "procurementproposals", "products", "producttrees", "projects", "suppliers", "tasks"
    ]
    for collection in collections:
        data = list(db[collection].find({"companyId": company_id}))
        for item in data:
            text = json.dumps(item, ensure_ascii=False, default=str)
            documents.append(text)
    print(f"Loaded {len(documents)} documents for company {company_id}")

def extract_value_after_keyword(question_lower, keyword):
    """חילוץ ערך אחרי מילת מפתח"""
    question_clean = " ".join(question_lower.split())
    if keyword in question_clean:
        start_idx = question_clean.index(keyword) + len(keyword)
        sub_part = question_clean[start_idx:].strip()
        return sub_part.split("?")[0].strip()
    return None

def extract_year(question_lower):
    """חילוץ שנה מהשאלה"""
    for word in question_lower.split():
        if word.isdigit() and len(word) == 4:
            return int(word)
    return None

def get_employee_name(employee_id):
    if not employee_id:
        return "לא ידוע"
    employee = db["employees"].find_one({"_id": ObjectId(employee_id)})
    return f"{employee.get('name', '')} {employee.get('lastName', '')}".strip() if employee else "לא ידוע"

def get_product_name(product_id):
    if not product_id:
        return "לא ידוע"
    product = db["products"].find_one({"_id": ObjectId(product_id)})
    return product.get("productName", "לא ידוע") if product else "לא ידוע"

def get_supplier_name(supplier_id):
    if not supplier_id:
        return "לא ידוע"
    supplier = db["suppliers"].find_one({"_id": ObjectId(supplier_id)})
    return supplier.get("SupplierName", "לא ידוע") if supplier else "לא ידוע"

def get_department_name(dept_id):
    if not dept_id:
        return "לא ידוע"
    dept = db["departments"].find_one({"_id": ObjectId(dept_id)})
    return dept.get("name", "לא ידוע") if dept else "לא ידוע"

def get_project_name(project_id):
    if not project_id:
        return "לא ידוע"
    project = db["projects"].find_one({"_id": ObjectId(project_id)})
    return project.get("name", "לא ידוע") if project else "לא ידוע"

def format_list(data_list, field_map):
    if not data_list:
        return "אין נתונים"
    lines = []
    for item in data_list:
        line = []
        for key, display in field_map.items():
            value = item.get(key, "לא ידוע")
            if key in ["employeeId", "approvedBy", "createdBy", "updatedBy", "reviewerId"]:
                value = get_employee_name(value)
            elif key in ["productId", "product"]:
                value = get_product_name(value)
            elif key == "supplierId":
                value = get_supplier_name(value)
            elif key == "projectId":
                value = get_project_name(value)
            line.append(f"{display}: {value}")
        lines.append(" - ".join(line))
    return "\n".join(lines)

def train_model(question, context_documents, company_id):
    question_lower = question.lower().strip()
    keywords = question_lower.split()

    # Budgets
    if "תקציב" in question_lower:
        dept_or_proj_name = extract_value_after_keyword(question_lower, "מחלקת") or \
                            extract_value_after_keyword(question_lower, "פרויקט")
        year = extract_year(question_lower)
        query = {"companyId": company_id}
        if dept_or_proj_name:
            query["departmentOrProjectName"] = dept_or_proj_name
        if year:
            query["startDate"] = {"$gte": datetime(year, 1, 1), "$lte": datetime(year, 12, 31)}
        budget_data = list(db["budgets"].find(query))
        if budget_data:
            budget = budget_data[0]
            context = dept_or_proj_name or "התקציב"
            if "סכום" in question_lower or "כמה" in question_lower:
                return f"סכום התקציב של {context} הוא {budget.get('amount', 0)} {budget.get('currency', 'ש\"ח')}."
            if "סכום שהוצא" in question_lower:
                return f"הסכום שהוצא מתקציב {context} הוא {budget.get('spentAmount', 0)} {budget.get('currency', 'ש\"ח')}."
            if "מטבע" in question_lower:
                return f"המטבע של התקציב של {context} הוא {budget.get('currency', 'ש\"ח')}."
            if "תקופה" in question_lower:
                return f"תקופת התקציב של {context} היא {budget.get('period', 'לא זמין')}."
            if "תאריך התחלה" in question_lower:
                return f"תאריך ההתחלה של התקציב של {context} הוא {budget.get('startDate', 'לא זמין')}."
            if "תאריך סיום" in question_lower:
                return f"תאריך הסיום של התקציב של {context} הוא {budget.get('endDate', 'לא זמין')}."
            if "סטטוס" in question_lower:
                return f"סטטוס התקציב של {context} הוא {budget.get('status', 'לא ידוע')}."
            if "קטגוריות" in question_lower:
                categories = format_list(budget.get("categories", []), {"name": "שם", "allocatedAmount": "סכום"})
                return f"קטגוריות התקציב של {context}:\n{categories}"
            if "פריטים" in question_lower:
                items = format_list(budget.get("items", []), {"productId": "מוצר", "quantity": "כמות", "unitPrice": "מחיר יחידה", "totalPrice": "סה\"כ"})
                return f"פריטים בתקציב של {context}:\n{items}"
            if "הערות" in question_lower:
                return f"הערות התקציב של {context}:\n{budget.get('notes', 'אין הערות')}"
            if "מי יצר" in question_lower:
                return f"התקציב של {context} נוצר על ידי {get_employee_name(budget.get('createdBy'))}."
            if "מי עודכן" in question_lower:
                return f"התקציב של {context} עודכן על ידי {get_employee_name(budget.get('updatedBy'))}."
            if "אישורים" in question_lower:
                approvals = format_list(budget.get("approvals", []), {"approvedBy": "מאשר", "approvedAt": "תאריך", "comment": "הערה"})
                return f"אישורים לתקציב של {context}:\n{approvals}"
            if "חתימות נוכחיות" in question_lower:
                return f"מספר החתימות הנוכחיות של התקציב של {context} הוא {budget.get('currentSignatures', 0)}."
            if "אינדקס חותם" in question_lower:
                return f"אינדקס החותם הנוכחי של התקציב של {context} הוא {budget.get('currentSignerIndex', 0)}."
            if "חותמים" in question_lower:
                signers = format_list(budget.get("signers", []), {"employeeId": "עובד", "name": "שם", "role": "תפקיד", "order": "סדר", "hasSigned": "חתם"})
                return f"חותמים לתקציב של {context}:\n{signers}"
            if "מחלקה" in question_lower:
                return f"מחלקת התקציב של {context} היא {get_department_name(budget.get('departmentId'))}."
            if "פרויקט" in question_lower:
                return f"פרויקט התקציב של {context} הוא {get_project_name(budget.get('projectId'))}."
            return f"מצאתי את המידע הבא על התקציב של {context}:\n{json.dumps(budget, ensure_ascii=False, default=str)}"
        return f"לא מצאתי תקציב עבור {dept_or_proj_name or 'התקציב'} {'לשנת ' + str(year) if year else ''}."

    # Customer Orders
    if "הזמנה" in question_lower or "הזמנות" in question_lower:
        customer_name = extract_value_after_keyword(question_lower, "לקוח")
        query = {"companyId": company_id}
        if customer_name:
            cust = db["customers"].find_one({"companyId": company_id, "name": customer_name})
            if cust:
                query["customer"] = cust["_id"]
        order_data = list(db["customerorders"].find(query))
        if order_data:
            order = order_data[0]
            customer_name = db["customers"].find_one({"_id": order.get("customer")}).get("name", "לא ידוע") if order.get("customer") else "לא ידוע"
            if "סכום" in question_lower:
                return f"סכום ההזמנה של {customer_name} הוא {order.get('orderTotal', 0)} ש\"ח."
            if "תאריך הזמנה" in question_lower:
                return f"תאריך ההזמנה של {customer_name} הוא {order.get('orderDate', 'לא זמין')}."
            if "תאריך משלוח" in question_lower:
                return f"תאריך המשלוח של ההזמנה של {customer_name} הוא {order.get('deliveryDate', 'לא זמין')}."
            if "פריטים" in question_lower:
                items = format_list(order.get("items", []), {"product": "מוצר", "quantity": "כמות", "unitPrice": "מחיר יחידה", "discount": "הנחה", "totalPrice": "סה\"כ"})
                return f"פריטים בהזמנה של {customer_name}:\n{items}"
            if "הנחה" in question_lower:
                return f"הנחה גלובלית של ההזמנה של {customer_name} היא {order.get('globalDiscount', 0)}%."
            if "סטטוס" in question_lower:
                return f"סטטוס ההזמנה של {customer_name} הוא {order.get('status', 'לא ידוע')}."
            if "הערות" in question_lower:
                return f"הערות ההזמנה של {customer_name}:\n{order.get('notes', 'אין הערות')}"
            return f"מצאתי את המידע הבא על ההזמנה של {customer_name}:\n{json.dumps(order, ensure_ascii=False, default=str)}"
        return f"לא מצאתי הזמנות עבור {customer_name or 'לקוח'}."

    # Customers
    if "לקוח" in question_lower and "הזמנה" not in question_lower:
        customer_name = extract_value_after_keyword(question_lower, "לקוח")
        query = {"companyId": company_id}
        if customer_name:
            query["name"] = customer_name
        customer_data = list(db["customers"].find(query))
        if customer_data:
            customer = customer_data[0]
            name = customer.get("name", "לא ידוע")
            if "מייל" in question_lower:
                return f"כתובת המייל של {name} היא {customer.get('email', 'לא זמין')}."
            if "טלפון" in question_lower:
                return f"מספר הטלפון של {name} הוא {customer.get('phone', 'לא זמין')}."
            if "כתובת" in question_lower:
                return f"כתובת הלקוח {name} היא {customer.get('address', 'לא זמין')}."
            if "חברה" in question_lower:
                return f"שם החברה של {name} הוא {customer.get('company', 'לא זמין')}."
            if "אתר" in question_lower:
                return f"אתר האינטרנט של {name} הוא {customer.get('website', 'לא זמין')}."
            if "תעשייה" in question_lower:
                return f"תעשיית הלקוח {name} היא {customer.get('industry', 'לא זמין')}."
            if "סטטוס" in question_lower:
                return f"סטטוס הלקוח {name} הוא {customer.get('status', 'לא ידוע')}."
            if "סוג" in question_lower:
                return f"סוג הלקוח {name} הוא {customer.get('customerType', 'לא ידוע')}."
            if "תאריך לידה" in question_lower:
                return f"תאריך הלידה של {name} הוא {customer.get('dateOfBirth', 'לא זמין')}."
            if "מין" in question_lower:
                return f"מין הלקוח {name} הוא {customer.get('gender', 'לא ידוע')}."
            if "שיטת קשר" in question_lower:
                return f"שיטת הקשר המועדפת של {name} היא {customer.get('preferredContactMethod', 'לא זמין')}."
            if "תאריך קשר אחרון" in question_lower:
                return f"תאריך הקשר האחרון עם {name} הוא {customer.get('lastContacted', 'לא זמין')}."
            if "לקוח מאז" in question_lower:
                return f"{name} הוא לקוח מאז {customer.get('customerSince', 'לא זמין')}."
            if "אנשי קשר" in question_lower:
                contacts = format_list(customer.get("contacts", []), {"name": "שם", "position": "תפקיד", "email": "מייל", "phone": "טלפון"})
                return f"אנשי הקשר של {name}:\n{contacts}"
            if "הערות" in question_lower:
                return f"הערות על {name}:\n{customer.get('notes', 'אין הערות')}"
            if "מי יצר" in question_lower:
                return f"הלקוח {name} נוצר על ידי {get_employee_name(customer.get('createdBy'))}."
            if "מי עודכן" in question_lower:
                return f"הלקוח {name} עודכן על ידי {get_employee_name(customer.get('updatedBy'))}."
            return f"מצאתי את המידע הבא על הלקוח {name}:\n{json.dumps(customer, ensure_ascii=False, default=str)}"
        return f"לא מצאתי את הלקוח {customer_name or 'לקוח'}."

    # Departments
    if "מחלקה" in question_lower:
        dept_name = extract_value_after_keyword(question_lower, "מחלקת") or extract_value_after_keyword(question_lower, "מחלקה")
        query = {"companyId": company_id}
        if dept_name:
            query["name"] = dept_name
        dept_data = list(db["departments"].find(query))
        if dept_data:
            dept = dept_data[0]
            name = dept.get("name", "לא ידוע")
            if "תיאור" in question_lower:
                return f"תיאור מחלקת {name} הוא {dept.get('description', 'אין תיאור זמין')}."
            if "מנהל" in question_lower:
                return f"המנהל של מחלקת {name} הוא {get_employee_name(dept.get('departmentManager'))}."
            if "עובדים" in question_lower:
                team = format_list(dept.get("teamMembers", []), {"employeeId": "עובד"})
                return f"העובדים במחלקת {name}:\n{team}"
            if "פרויקטים" in question_lower:
                projects = format_list(dept.get("projects", []), {"projectId": "פרויקט"})
                return f"הפרויקטים של מחלקת {name}:\n{projects}"
            if "תקציבים" in question_lower:
                budgets = format_list(dept.get("budgets", []), {"budgetId": "תקציב"})
                return f"התקציבים של מחלקת {name}:\n{budgets}"
            return f"מצאתי את המידע הבא על מחלקת {name}:\n{json.dumps(dept, ensure_ascii=False, default=str)}"
        return f"לא מצאתי את מחלקת {dept_name or 'מחלקה'}."

    # Employees
    if "עובד" in question_lower:
        employee_name = extract_value_after_keyword(question_lower, "עובד")
        query = {"companyId": company_id}
        if employee_name:
            # חיפוש לפי שם או שם משפחה
            query["$or"] = [
                {"name": {"$regex": employee_name, "$options": "i"}},
                {"lastName": {"$regex": employee_name, "$options": "i"}}
            ]
        employee_data = list(db["employees"].find(query))
        if employee_data:
            employee = employee_data[0]
            full_name = f"{employee.get('name', 'לא ידוע')} {employee.get('lastName', 'לא ידוע')}"
            if "שם" in question_lower:
                return f"שם העובד הוא {full_name}."
            if "מין" in question_lower:
                return f"מין העובד {full_name} הוא {employee.get('gender', 'לא ידוע')}."
            if "תעודת זהות" in question_lower:
                return f"תעודת הזהות של {full_name} היא {employee.get('identity', 'לא זמין')}."
            if "מייל" in question_lower:
                return f"כתובת המייל של {full_name} היא {employee.get('email', 'לא זמין')}."
            if "תפקיד" in question_lower:
                return f"תפקידו של {full_name} הוא {employee.get('role', 'לא זמין')}."
            if "טלפון" in question_lower:
                return f"מספר הטלפון של {full_name} הוא {employee.get('phone', 'לא זמין')}."
            if "תמונת פרופיל" in question_lower:
                return f"תמונת הפרופיל של {full_name} היא {employee.get('profileImage', 'לא זמין')}."
            if "מחלקה" in question_lower:
                return f"מחלקתו של {full_name} היא {get_department_name(employee.get('department'))}."
            if "פרויקטים" in question_lower:
                projects = format_list(employee.get("projects", []), {"projectId": "פרויקט", "role": "תפקיד"})
                return f"הפרויקטים של {full_name}:\n{projects}"
            if "הטבות" in question_lower:
                benefits = "\n".join([f"- {b}" for b in employee.get('benefits', [])])
                return f"הטבות של {full_name}:\n{benefits or 'אין הטבות'}"
            if "ביקורות ביצועים" in question_lower:
                reviews = format_list(employee.get("performanceReviews", []), {"reviewId": "ביקורת", "score": "ציון"})
                return f"ביקורות הביצועים של {full_name}:\n{reviews}"
            if "נוכחות" in question_lower:
                attendance = format_list(employee.get("attendance", []), {"date": "תאריך", "status": "סטטוס"})
                return f"נוכחות של {full_name}:\n{attendance}"
            if "כתובת" in question_lower:
                address = employee.get("address", {})
                return f"כתובת של {full_name}: {address.get('city', 'לא זמין')}, {address.get('street', 'לא זמין')}, {address.get('country', 'לא זמין')}"
            if "סטטוס" in question_lower:
                return f"סטטוס של {full_name} הוא {employee.get('status', 'לא ידוע')}."
            if "התחברות אחרונה" in question_lower:
                return f"התחברות אחרונה של {full_name} היא {employee.get('lastLogin', 'לא זמין')}."
            return f"מצאתי את המידע הבא על {full_name}:\n{json.dumps(employee, ensure_ascii=False, default=str)}"
        return f"לא מצאתי את העובד {employee_name or 'עובד'}."

    # Events
    if "אירוע" in question_lower:
        title = extract_value_after_keyword(question_lower, "אירוע")
        query = {"companyId": company_id}
        if title:
            query["title"] = title
        event_data = list(db["events"].find(query))
        if event_data:
            event = event_data[0]
            title = event.get("title", "לא ידוע")
            if "תיאור" in question_lower:
                return f"תיאור האירוע {title} הוא {event.get('description', 'לא זמין')}."
            if "תאריך התחלה" in question_lower:
                return f"תאריך ההתחלה של האירוע {title} הוא {event.get('startDate', 'לא זמין')}."
            if "תאריך סיום" in question_lower:
                return f"תאריך הסיום של האירוע {title} הוא {event.get('endDate', 'לא זמין')}."
            if "שעת התחלה" in question_lower:
                return f"שעת ההתחלה של האירוע {title} היא {event.get('startTime', 'לא זמין')}."
            if "שעת סיום" in question_lower:
                return f"שעת הסיום של האירוע {title} היא {event.get('endTime', 'לא זמין')}."
            if "כל היום" in question_lower:
                return f"האירוע {title} הוא כל היום: {event.get('allDay', False)}."
            if "מיקום" in question_lower:
                return f"מיקום האירוע {title} הוא {event.get('location', 'לא זמין')}."
            if "קישור" in question_lower:
                return f"קישור הפגישה של האירוע {title} הוא {event.get('meetingUrl', 'לא זמין')}."
            if "סוג" in question_lower:
                return f"סוג האירוע {title} הוא {event.get('eventType', 'לא ידוע')}."
            if "משתתפים" in question_lower:
                participants = format_list([{"employeeId": p} for p in event.get("participants", [])], {"employeeId": "משתתף"})
                return f"משתתפים באירוע {title}:\n{participants}"
            if "משתתפים חיצוניים" in question_lower:
                external = format_list(event.get("externalParticipants", []), {"name": "שם", "email": "מייל", "phone": "טלפון"})
                return f"משתתפים חיצוניים באירוע {title}:\n{external}"
            if "חזרה" in question_lower:
                return f"חזרת האירוע {title} היא {event.get('recurrence', 'לא זמין')}."
            if "קבצים" in question_lower:
                attachments = format_list(event.get("attachments", []), {"fileName": "שם קובץ", "fileUrl": "קישור"})
                return f"קבצים של האירוע {title}:\n{attachments}"
            if "מי יצר" in question_lower:
                return f"האירוע {title} נוצר על ידי {get_employee_name(event.get('createdBy'))}."
            if "הערות" in question_lower:
                return f"הערות האירוע {title}:\n{event.get('notes', 'אין הערות')}"
            return f"מצאתי את המידע הבא על האירוע {title}:\n{json.dumps(event, ensure_ascii=False, default=str)}"
        return f"לא מצאתי את האירוע {title or 'אירוע'}."

    # Finances (הכנסות/הוצאות)
    if "הכנסות" in question_lower or "הוצאות" in question_lower:
        year = extract_year(question_lower)
        # נקבע מראש את context גם אם בסוף לא יימצאו נתונים
        if "הכנסות" in question_lower:
            base_context = "הכנסות"
            transaction_type = "Income"
        else:
            base_context = "הוצאות"
            transaction_type = "Expense"

        query = {"companyId": company_id}
        query["transactionType"] = transaction_type  # הכנסות או הוצאות
        if year:
            query["transactionDate"] = {"$gte": datetime(year, 1, 1), "$lte": datetime(year, 12, 31)}

        finance_data = list(db["finances"].find(query))

        # נבנה את context המדויק
        context = f"{base_context} {'ב-' + str(year) if year else ''}"

        if finance_data:
            finance = finance_data[0]
            # כאן אפשר להציג סכומים כלליים, או רק נתון מהעסקה הראשונה.
            # לדוגמה – סכום כולל לכל הרשומות
            if "סכום" in question_lower:
                total = sum(f.get("transactionAmount", 0) for f in finance_data)
                return f"{context} הכוללות הן {total} {finance.get('transactionCurrency', 'ש\"ח')}."
            if "תאריך" in question_lower:
                return f"תאריך העסקה של {context} הוא {finance.get('transactionDate', 'לא זמין')}."
            if "סוג" in question_lower:
                return f"סוג העסקה של {context} הוא {finance.get('transactionType', 'לא ידוע')}."
            if "מטבע" in question_lower:
                return f"מטבע העסקה של {context} הוא {finance.get('transactionCurrency', 'ש\"ח')}."
            if "תיאור" in question_lower:
                return f"תיאור העסקה של {context} הוא {finance.get('transactionDescription', 'לא זמין')}."
            if "קטגוריה" in question_lower:
                return f"קטגוריית העסקה של {context} היא {finance.get('category', 'לא זמין')}."
            if "חשבון בנק" in question_lower:
                return f"חשבון הבנק של העסקה של {context} הוא {finance.get('bankAccount', 'לא זמין')}."
            if "סטטוס" in question_lower:
                return f"סטטוס העסקה של {context} הוא {finance.get('transactionStatus', 'לא ידוע')}."
            if "סוג רשומה" in question_lower:
                return f"סוג הרשומה של העסקה של {context} הוא {finance.get('recordType', 'לא ידוע')}."
            if "צד העסקה" in question_lower:
                party_id = finance.get("partyId")
                party_name = get_employee_name(party_id) if finance.get("recordType") == "employee" \
                             else get_supplier_name(party_id) if finance.get("recordType") == "supplier" \
                             else "לא ידוע"
                return f"צד העסקה של {context} הוא {party_name}."
            if "קבצים" in question_lower:
                attachments = "\n".join([f"- {url}" for url in finance.get('attachmentURL', [])])
                return f"קבצים של העסקה של {context}:\n{attachments or 'אין קבצים'}"
            if "מספר חשבונית" in question_lower:
                return f"מספר החשבונית של העסקה של {context} הוא {finance.get('invoiceNumber', 'לא זמין')}."
            if "פרטים נוספים" in question_lower:
                return f"פרטים נוספים של העסקה של {context}:\n{finance.get('otherDetails', 'אין פרטים')}"
            return f"מצאתי את המידע הבא על {context}:\n{json.dumps(finance, ensure_ascii=False, default=str)}"
        else:
            # כאן נשיב שאיננו מוצאים נתונים עבור context (כבר מוגדר)
            return f"לא מצאתי {context}."

    # Inventories
    if "מלאי" in question_lower:
        product_name = extract_value_after_keyword(question_lower, "מוצר")
        query = {"companyId": company_id}
        if product_name:
            product = db["products"].find_one({"companyId": company_id, "productName": product_name})
            if product:
                query["productId"] = product["_id"]
        inventory_data = list(db["inventories"].find(query))
        if inventory_data:
            inventory = inventory_data[0]
            product_name = get_product_name(inventory.get("productId"))
            if "כמות" in question_lower:
                return f"כמות המלאי של {product_name} היא {inventory.get('quantity', 0)} יחידות."
            if "מינימום" in question_lower:
                return f"רמת המלאי המינימלית של {product_name} היא {inventory.get('minStockLevel', 0)} יחידות."
            if "כמות להזמנה" in question_lower:
                return f"כמות ההזמנה מחדש של {product_name} היא {inventory.get('reorderQuantity', 0)} יחידות."
            if "מספר אצווה" in question_lower:
                return f"מספר האצווה של {product_name} הוא {inventory.get('batchNumber', 'לא זמין')}."
            if "תאריך תפוגה" in question_lower:
                return f"תאריך התפוגה של {product_name} הוא {inventory.get('expirationDate', 'לא זמין')}."
            if "מיקום מדף" in question_lower:
                return f"מיקום המדף של {product_name} הוא {inventory.get('shelfLocation', 'לא זמין')}."
            if "תאריך הזמנה אחרון" in question_lower:
                return f"תאריך ההזמנה האחרון של {product_name} הוא {inventory.get('lastOrderDate', 'לא זמין')}."
            return f"מצאתי את המידע הבא על המלאי של {product_name}:\n{json.dumps(inventory, ensure_ascii=False, default=str)}"
        return f"לא מצאתי מלאי עבור {product_name or 'מוצר'}."

    # Payments
    if "תשלום" in question_lower or "שילמנו" in question_lower:
        plan_name = extract_value_after_keyword(question_lower, "תוכנית")
        query = {"companyId": company_id}
        if plan_name:
            query["planName"] = plan_name
        payment_data = list(db["payments"].find(query))
        if payment_data:
            payment = payment_data[0]
            plan_name = payment.get("planName", "לא ידוע")
            if "סכום" in question_lower:
                return f"סכום התשלום עבור תוכנית {plan_name} הוא {payment.get('amount', 0)} {payment.get('currency', 'ש\"ח')}."
            if "מטבע" in question_lower:
                return f"מטבע התשלום של תוכנית {plan_name} הוא {payment.get('currency', 'ש\"ח')}."
            if "תאריך תשלום" in question_lower:
                return f"תאריך התשלום של תוכנית {plan_name} הוא {payment.get('paymentDate', 'לא זמין')}."
            if "תאריך התחלה" in question_lower:
                return f"תאריך ההתחלה של תוכנית {plan_name} הוא {payment.get('startDate', 'לא זמין')}."
            if "תאריך סיום" in question_lower:
                return f"תאריך הסיום של תוכנית {plan_name} הוא {payment.get('endDate', 'לא זמין')}."
            if "הוחזר" in question_lower:
                return f"התשלום עבור תוכנית {plan_name} הוחזר: {payment.get('refunded', False)}."
            if "מזהה סשן" in question_lower:
                return f"מזהה הסשן של התשלום עבור תוכנית {plan_name} הוא {payment.get('sessionId', 'לא זמין')}."
            return f"מצאתי את המידע הבא על התשלום עבור תוכנית {plan_name}:\n{json.dumps(payment, ensure_ascii=False, default=str)}"
        return f"לא מצאתי תשלומים עבור תוכנית {plan_name or 'תוכנית'}."

    # Procurement Proposals
    if "הצעת רכש" in question_lower:
        proposal_title = extract_value_after_keyword(question_lower, "הצעת רכש")
        query = {"companyId": company_id}
        if proposal_title:
            query["title"] = proposal_title
        proposal_data = list(db["procurementproposals"].find(query))
        if proposal_data:
            proposal = proposal_data[0]
            title = proposal.get("title", "לא ידוע")
            if "תיאור" in question_lower:
                return f"תיאור הצעת הרכש {title} הוא {proposal.get('description', 'לא זמין')}."
            if "פריטים" in question_lower:
                items = format_list(proposal.get("items", []), {"productId": "מוצר", "productName": "שם", "quantity": "כמות", "unitPrice": "מחיר יחידה", "total": "סה\"כ"})
                return f"פריטים בהצעת הרכש {title}:\n{items}"
            if "עלות משוערת" in question_lower:
                return f"עלות משוערת של הצעת הרכש {title} היא {proposal.get('totalEstimatedCost', 0)} ש\"ח."
            if "סטטוס" in question_lower:
                return f"סטטוס הצעת הרכש {title} הוא {proposal.get('status', 'לא ידוע')}."
            if "מי יצר" in question_lower:
                return f"הצעת הרכש {title} נוצרה על ידי {get_employee_name(proposal.get('createdBy'))}."
            if "תאריך בקשה" in question_lower:
                return f"תאריך הבקשה של הצעת הרכש {title} הוא {proposal.get('requestedDate', 'לא זמין')}."
            if "תאריך משלוח צפוי" in question_lower:
                return f"תאריך המשלוח הצפוי של הצעת הרכש {title} הוא {proposal.get('expectedDeliveryDate', 'לא זמין')}."
            if "הערות" in question_lower:
                return f"הערות של הצעת הרכש {title}:\n{proposal.get('notes', 'אין הערות')}"
            if "קבצים" in question_lower:
                attachments = format_list(proposal.get("attachments", []), {"fileName": "שם קובץ"})
                return f"קבצים של הצעת הרכש {title}:\n{attachments}"
            return f"מצאתי את המידע הבא על הצעת הרכש {title}:\n{json.dumps(proposal, ensure_ascii=False, default=str)}"
        return f"לא מצאתי את הצעת הרכש {proposal_title or 'הצעה'}."

    # Procurements
    if "תעודת הרכש" in question_lower or "po" in question_lower.lower():
        po_number = None
        for word in keywords:
            if "po-" in word.lower():
                po_number = word
                break
        query = {"companyId": company_id}
        if po_number:
            query["PurchaseOrder"] = po_number
        procurement_data = list(db["procurements"].find(query))
        if procurement_data:
            procurement = procurement_data[0]
            po_number = procurement.get("PurchaseOrder", "לא ידוע")
            if "ספק" in question_lower:
                return f"הספק של תעודת הרכש {po_number} הוא {procurement.get('supplierName', 'לא ידוע')}."
            if "מוצרים" in question_lower:
                products = format_list(procurement.get("products", []), {"productId": "מוצר", "productName": "שם", "quantity": "כמות", "unitPrice": "מחיר יחידה", "total": "סה\"כ"})
                return f"מוצרים בתעודת הרכש {po_number}:\n{products}"
            if "שיטת תשלום" in question_lower:
                return f"שיטת התשלום של תעודת הרכש {po_number} היא {procurement.get('PaymentMethod', 'לא זמין')}."
            if "תנאי תשלום" in question_lower:
                return f"תנאי התשלום של תעודת הרכש {po_number} הם {procurement.get('PaymentTerms', 'לא זמין')}."
            if "כתובת משלוח" in question_lower:
                return f"כתובת המשלוח של תעודת הרכש {po_number} היא {procurement.get('DeliveryAddress', 'לא זמין')}."
            if "שיטת משלוח" in question_lower:
                return f"שיטת המשלוח של תעודת הרכש {po_number} היא {procurement.get('ShippingMethod', 'לא זמין')}."
            if "תאריך רכישה" in question_lower:
                return f"תאריך הרכישה של תעודת הרכש {po_number} הוא {procurement.get('purchaseDate', 'לא זמין')}."
            if "תאריך משלוח" in question_lower:
                return f"תאריך המשלוח של תעודת הרכש {po_number} הוא {procurement.get('deliveryDate', 'לא זמין')}."
            if "סטטוס הזמנה" in question_lower:
                return f"סטטוס ההזמנה של תעודת הרכש {po_number} הוא {procurement.get('orderStatus', 'לא ידוע')}."
            if "סטטוס אישור" in question_lower:
                return f"סטטוס האישור של תעודת הרכש {po_number} הוא {procurement.get('approvalStatus', 'לא ידוע')}."
            if "הערות" in question_lower:
                return f"הערות של תעודת הרכש {po_number}:\n{procurement.get('notes', 'אין הערות')}"
            if "סטטוס תשלום" in question_lower:
                return f"סטטוס התשלום של תעודת הרכש {po_number} הוא {procurement.get('paymentStatus', 'לא ידוע')}."
            if "עלות משלוח" in question_lower:
                return f"עלות המשלוח של תעודת הרכש {po_number} היא {procurement.get('shippingCost', 0)} {procurement.get('currency', 'ש\"ח')}."
            if "מטבע" in question_lower:
                return f"מטבע התשלום של תעודת הרכש {po_number} הוא {procurement.get('currency', 'ש\"ח')}."
            if "מכס" in question_lower:
                return f"האם נדרש מכס לתעודת הרכש {po_number}: {procurement.get('requiresCustoms', False)}."
            if "תאריך תפוגת אחריות" in question_lower:
                return f"תאריך תפוגת האחריות של תעודת הרכש {po_number} הוא {procurement.get('warrantyExpiration', 'לא זמין')}."
            if "תאריך קבלה" in question_lower:
                return f"תאריך הקבלה של תעודת הרכש {po_number} הוא {procurement.get('receivedDate', 'לא זמין')}."
            if "עלות כוללת" in question_lower:
                return f"עלות כוללת של תעודת הרכש {po_number} היא {procurement.get('totalCost', 0)} {procurement.get('currency', 'ש\"ח')}."
            if "סיכום" in question_lower:
                return f"סיכום תעודת הרכש {po_number}:\n{procurement.get('summeryProcurement', 'לא זמין')}"
            if "חתימות נוכחיות" in question_lower:
                return f"מספר החתימות הנוכחיות של תעודת הרכש {po_number} הוא {procurement.get('currentSignatures', 0)}."
            if "אינדקס חותם" in question_lower:
                return f"אינדקס החותם הנוכחי של תעודת הרכש {po_number} הוא {procurement.get('currentSignerIndex', 0)}."
            if "חותמים" in question_lower:
                signers = format_list(procurement.get("signers", []), {"employeeId": "עובד", "name": "שם", "role": "תפקיד", "order": "סדר", "hasSigned": "חתם"})
                return f"חותמים של תעודת הרכש {po_number}:\n{signers}"
            if "סטטוס" in question_lower:
                return f"סטטוס כללי של תעודת הרכש {po_number} הוא {procurement.get('status', 'לא ידוע')}."
            return f"מצאתי את המידע הבא על תעודת הרכש {po_number}:\n{json.dumps(procurement, ensure_ascii=False, default=str)}"
        return f"לא מצאתי את תעודת הרכש {po_number or 'תעודה'}."

    # Products
    if "מוצר" in question_lower:
        product_name = extract_value_after_keyword(question_lower, "מוצר")
        query = {"companyId": company_id}
        if product_name:
            query["productName"] = product_name
        product_data = list(db["products"].find(query))
        if product_data:
            product = product_data[0]
            name = product.get("productName", "לא ידוע")
            if "מקט" in question_lower:
                return f"מק\"ט של המוצר {name} הוא {product.get('sku', 'לא זמין')}."
            if "ברקוד" in question_lower:
                return f"ברקוד של המוצר {name} הוא {product.get('barcode', 'לא זמין')}."
            if "תיאור" in question_lower:
                return f"תיאור המוצר {name} הוא {product.get('productDescription', 'לא זמין')}."
            if "מחיר" in question_lower:
                return f"מחיר המוצר {name} הוא {product.get('unitPrice', 0)} ש\"ח."
            if "קטגוריה" in question_lower:
                return f"קטגוריית המוצר {name} היא {product.get('category', 'לא זמין')}."
            if "ספק" in question_lower:
                return f"הספק של המוצר {name} הוא {get_supplier_name(product.get('supplierId'))}."
            if "אורך" in question_lower:
                return f"אורך המוצר {name} הוא {product.get('length', 'לא זמין')}."
            if "רוחב" in question_lower:
                return f"רוחב המוצר {name} הוא {product.get('width', 'לא זמין')}."
            if "גובה" in question_lower:
                return f"גובה המוצר {name} הוא {product.get('height', 'לא זמין')}."
            if "נפח" in question_lower:
                return f"נפח המוצר {name} הוא {product.get('volume', 'לא זמין')}."
            if "שם ספק" in question_lower:
                return f"שם הספק של המוצר {name} הוא {product.get('supplierName', 'לא זמין')}."
            if "תמונה" in question_lower:
                return f"תמונת המוצר {name} היא {product.get('productImage', 'לא זמין')}."
            if "קבצים" in question_lower:
                attachments = format_list(product.get("attachments", []), {"fileName": "שם קובץ", "fileUrl": "קישור"})
                return f"קבצים של המוצר {name}:\n{attachments}"
            if "סוג" in question_lower:
                return f"סוג המוצר {name} הוא {product.get('productType', 'לא ידוע')}."
            return f"מצאתי את המידע הבא על המוצר {name}:\n{json.dumps(product, ensure_ascii=False, default=str)}"
        return f"לא מצאתי את המוצר {product_name or 'מוצר'}."

    # Projects
    if "פרויקט" in question_lower:
        project_name = extract_value_after_keyword(question_lower, "פרויקט")
        query = {"companyId": company_id}
        if project_name:
            query["name"] = project_name
        project_data = list(db["projects"].find(query))
        if project_data:
            project = project_data[0]
            name = project.get("name", "לא ידוע")
            if "מנהל" in question_lower:
                return f"מנהל הפרויקט {name} הוא {get_employee_name(project.get('projectManager'))}."
            if "תיאור" in question_lower:
                return f"תיאור הפרויקט {name} הוא {project.get('description', 'לא זמין')}."
            if "תאריך התחלה" in question_lower:
                return f"תאריך ההתחלה של הפרויקט {name} הוא {project.get('startDate', 'לא זמין')}."
            if "תאריך סיום" in question_lower:
                return f"תאריך הסיום של הפרויקט {name} הוא {project.get('endDate', 'לא זמין')}."
            if "סטטוס" in question_lower:
                return f"סטטוס הפרויקט {name} הוא {project.get('status', 'לא ידוע')}."
            if "מחלקה" in question_lower:
                return f"מחלקת הפרויקט {name} היא {get_department_name(project.get('departmentId'))}."
            if "חברי צוות" in question_lower:
                team = format_list(project.get("teamMembers", []), {"employeeId": "עובד"})
                return f"חברי הצוות של הפרויקט {name}:\n{team}"
            if "תקציב" in question_lower:
                return f"תקציב הפרויקט {name} הוא {project.get('budget', 0)} ש\"ח."
            if "עדיפות" in question_lower:
                return f"עדיפות הפרויקט {name} היא {project.get('priority', 'לא זמין')}."
            if "משימות" in question_lower:
                tasks = format_list(project.get("tasks", []), {"taskId": "משימה"})
                return f"משימות הפרויקט {name}:\n{tasks}"
            if "מסמכים" in question_lower:
                docs = "\n".join([f"- {doc}" for doc in project.get('documents', [])])
                return f"מסמכים של הפרויקט {name}:\n{docs or 'אין מסמכים'}"
            if "תגיות" in question_lower:
                tags = "\n".join([f"- {tag}" for tag in project.get('tags', [])])
                return f"תגיות של הפרויקט {name}:\n{tags or 'אין תגיות'}"
            if "הערות" in question_lower:
                comments = format_list(project.get("comments", []), {"user": "משתמש", "text": "טקסט", "createdAt": "תאריך"})
                return f"הערות של הפרויקט {name}:\n{comments}"
            if "התקדמות" in question_lower:
                return f"התקדמות הפרויקט {name} היא {project.get('progress', 0)}%."
            return f"מצאתי את המידע הבא על הפרויקט {name}:\n{json.dumps(project, ensure_ascii=False, default=str)}"
        return f"לא מצאתי את הפרויקט {project_name or 'פרויקט'}."

    # Suppliers
    if "ספק" in question_lower and "תעודת הרכש" not in question_lower:
        supplier_name = extract_value_after_keyword(question_lower, "ספק")
        query = {"companyId": company_id}
        if supplier_name:
            query["SupplierName"] = supplier_name
        supplier_data = list(db["suppliers"].find(query))
        if supplier_data:
            supplier = supplier_data[0]
            name = supplier.get("SupplierName", "לא ידוע")
            if "איש קשר" in question_lower:
                return f"איש הקשר של הספק {name} הוא {supplier.get('Contact', 'לא זמין')}."
            if "טלפון" in question_lower:
                return f"מספר הטלפון של הספק {name} הוא {supplier.get('Phone', 'לא זמין')}."
            if "מייל" in question_lower:
                return f"כתובת המייל של הספק {name} היא {supplier.get('Email', 'לא זמין')}."
            if "כתובת" in question_lower:
                return f"כתובת הספק {name} היא {supplier.get('Address', 'לא זמין')}."
            if "חשבון בנק" in question_lower:
                return f"חשבון הבנק של הספק {name} הוא {supplier.get('BankAccount', 'לא זמין')}."
            if "דירוג" in question_lower:
                ratings = "\n".join([f"- {r}" for r in supplier.get('Rating', [])])
                return f"דירוגים של הספק {name}:\n{ratings or 'אין דירוגים'}"
            if "מטבע" in question_lower:
                return f"מטבע הבסיס של הספק {name} הוא {supplier.get('baseCurrency', 'לא זמין')}."
            if "פעיל" in question_lower:
                return f"הספק {name} פעיל: {supplier.get('IsActive', True)}."
            if "חשבון אישור" in question_lower:
                return f"חשבון האישור של הספק {name} הוא {supplier.get('ConfirmationAccount', 'לא זמין')}."
            if "קבצים" in question_lower:
                attachments = format_list(supplier.get("attachments", []), {"fileName": "שם קובץ", "fileUrl": "קישור"})
                return f"קבצים של הספק {name}:\n{attachments}"
            if "מוצרים" in question_lower:
                products = format_list(supplier.get("ProductsSupplied", []), {"productId": "מוצר"})
                return f"מוצרים שמספק הספק {name}:\n{products}"
            return f"מצאתי את המידע הבא על הספק {name}:\n{json.dumps(supplier, ensure_ascii=False, default=str)}"
        return f"לא מצאתי את הספק {supplier_name or 'ספק'}."

    # Tasks
    if "משימה" in question_lower or "משימות" in question_lower:
        project_name = extract_value_after_keyword(question_lower, "פרויקט")
        query = {"companyId": company_id}
        if project_name:
            project = db["projects"].find_one({"companyId": company_id, "name": project_name})
            if project:
                query["projectId"] = project["_id"]
        task_data = list(db["tasks"].find(query))
        if task_data:
            task = task_data[0]
            title = task.get("title", "לא ידוע")
            if "תיאור" in question_lower:
                return f"תיאור המשימה {title} הוא {task.get('description', 'לא זמין')}."
            if "סטטוס" in question_lower:
                return f"סטטוס המשימה {title} הוא {task.get('status', 'לא ידוע')}."
            if "עדיפות" in question_lower:
                return f"עדיפות המשימה {title} היא {task.get('priority', 'לא זמין')}."
            if "תאריך יעד" in question_lower:
                return f"תאריך היעד של המשימה {title} הוא {task.get('dueDate', 'לא זמין')}."
            if "מי שובץ" in question_lower:
                assigned = format_list([{"employeeId": a} for a in task.get("assignedTo", [])], {"employeeId": "עובד"})
                return f"מי ששובץ למשימה {title}:\n{assigned}"
            if "מזהה הזמנה" in question_lower:
                return f"מזהה ההזמנה של המשימה {title} הוא {task.get('orderId', 'לא זמין')}."
            if "פריטי הזמנה" in question_lower:
                items = format_list(task.get("orderItems", []), {"productId": "מוצר", "productName": "שם", "quantity": "כמות"})
                return f"פריטי ההזמנה של המשימה {title}:\n{items}"
            if "מחלקה" in question_lower:
                return f"מחלקת המשימה {title} היא {get_department_name(task.get('departmentId'))}."
            return f"מצאתי את המידע הבא על המשימה {title}:\n{json.dumps(task, ensure_ascii=False, default=str)}"
        return f"לא מצאתי משימות עבור {project_name or 'פרויקט'}."

    # חיפוש כללי (fallback)
    relevant_docs = [doc for doc in context_documents if any(keyword in doc.lower() for keyword in keywords)]
    if not relevant_docs:
        relevant_docs = context_documents

    if relevant_docs:
        all_texts = relevant_docs + [question]
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform(all_texts)
        question_vector = tfidf_matrix[-1]
        context_vectors = tfidf_matrix[:-1]
        similarities = cosine_similarity(question_vector, context_vectors)
        best_match_idx = similarities.argmax()
        similarity_score = similarities[0][best_match_idx]
        if similarity_score > 0.1:
            best_doc = json.loads(relevant_docs[best_match_idx])
            return f"מצאתי מידע קרוב לשאלתך:\n{json.dumps(best_doc, ensure_ascii=False, default=str)}"

    return "לא מצאתי תשובה מתאימה לשאלה שלך."

@app.post("/chat")
async def chat(request: Request):
    global documents, answers
    data = await request.json()
    message = data.get("message")
    company_id = data.get("companyId")
    try:
        company_id = ObjectId(company_id)
    except Exception as e:
        print(f"Error converting companyId: {e}")
        return {"reply": "מזהה החברה אינו תקין."}

    if not documents:
        load_data_to_documents(company_id)

    if message in answers:
        return {"reply": answers[message]}

    reply = train_model(message, documents, company_id)
    answers[message] = reply
    print(f"Learned answer for '{message}': {reply}")
    return {"reply": reply}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
