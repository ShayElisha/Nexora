import Employees from "../models/employees.model.js";
import Finance from "../models/finance.model.js";
import Procurement from "../models/procurement.model.js";
import Suppliers from "../models/suppliers.model.js";
import Budget from "../models/Budget.model.js";
import Salary from "../models/Salary.model.js";
import Shifts from "../models/Shifts.model.js";
import Projects from "../models/project.model.js";
import Tasks from "../models/tasks.model.js";
import Customers from "../models/customers.model.js";
import CustomerOrder from "../models/CustomerOrder.model.js";
import Inventory from "../models/inventory.model.js";
import Product from "../models/product.model.js";
import Department from "../models/department.model.js";
import PerformanceReview from "../models/performanceReview.model.js";
import Companies from "../models/companies.model.js";
import Payment from "../models/payment.model.js";
import Conversation from "../models/Conversation.model.js";
import axios from "axios";

/**
 * Advanced AI Assistant Controller
 * Enhanced version with web search, extensive database knowledge, and intelligent predictions
 */

// Lightweight in-memory cache (TTL in ms)
const aiResponseCache = new Map();
const setCache = (key, value, ttlMs = 30000) => {
  const expiresAt = Date.now() + ttlMs;
  aiResponseCache.set(key, { value, expiresAt });
};
const getCache = (key) => {
  const hit = aiResponseCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    aiResponseCache.delete(key);
    return null;
  }
  return hit.value;
};

// Simple language detection (Hebrew vs English)
const detectLanguage = (text) => (/[א-ת]/.test(text) ? 'he' : 'en');

// Entity Extraction - Extract dates, amounts, departments, employees, timeframes
const extractEntities = async (message, companyId) => {
  const entities = {
    dates: [],
    amounts: [],
    departments: [],
    employees: [],
    timeframes: [],
    months: [],
    years: []
  };

  const msg = message.toLowerCase();

  // Extract dates (DD/MM/YYYY, MM/YYYY, etc.)
  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
    /(\d{1,2})\/(\d{4})/g,
    /(\d{4})-(\d{1,2})-(\d{1,2})/g
  ];
  
  datePatterns.forEach(pattern => {
    const matches = message.matchAll(pattern);
    for (const match of matches) {
      entities.dates.push(match[0]);
    }
  });

  // Extract relative dates
  const relativeDates = {
    'היום': new Date(),
    'אתמול': new Date(Date.now() - 24 * 60 * 60 * 1000),
    'מחר': new Date(Date.now() + 24 * 60 * 60 * 1000),
    'השבוע': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    'החודש': new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    'השנה': new Date(new Date().getFullYear(), 0, 1),
    'today': new Date(),
    'yesterday': new Date(Date.now() - 24 * 60 * 60 * 1000),
    'tomorrow': new Date(Date.now() + 24 * 60 * 60 * 1000),
    'this week': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    'this month': new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    'this year': new Date(new Date().getFullYear(), 0, 1)
  };

  Object.keys(relativeDates).forEach(key => {
    if (msg.includes(key)) {
      entities.dates.push(relativeDates[key]);
    }
  });

  // Extract amounts (₪, $, numbers)
  const amountPattern = /(\$|₪|שקל|דולר|nis|usd)?\s*(\d+(?:\.\d+)?)\s*(k|thousand|אלף|מיליון|million)?/gi;
  const amountMatches = message.matchAll(amountPattern);
  for (const match of amountMatches) {
    let amount = parseFloat(match[2]);
    if (match[3] && (match[3].toLowerCase().includes('k') || match[3].includes('אלף'))) {
      amount *= 1000;
    } else if (match[3] && match[3].toLowerCase().includes('million') || match[3].includes('מיליון')) {
      amount *= 1000000;
    }
    entities.amounts.push({
      value: amount,
      currency: match[1] || '₪',
      original: match[0]
    });
  }

  // Extract departments (from database)
  try {
    const departments = await Department.find({ companyId: companyId }).select('name');
    departments.forEach(dept => {
      if (msg.includes(dept.name.toLowerCase())) {
        entities.departments.push(dept.name);
      }
    });
  } catch (e) {
    console.error("Error extracting departments:", e);
  }

  // Extract employee names (from database)
  try {
    const employees = await Employees.find({ companyId: companyId }).select('name lastName');
    employees.forEach(emp => {
      const fullName = `${emp.name} ${emp.lastName}`.toLowerCase();
      if (msg.includes(emp.name.toLowerCase()) || msg.includes(fullName)) {
        entities.employees.push(fullName);
      }
    });
  } catch (e) {
    console.error("Error extracting employees:", e);
  }

  // Extract timeframes
  const timeframePatterns = {
    'last month': 'last_month',
    'חודש שעבר': 'last_month',
    'last week': 'last_week',
    'שבוע שעבר': 'last_week',
    'last year': 'last_year',
    'שנה שעברה': 'last_year',
    'next month': 'next_month',
    'חודש הבא': 'next_month',
    'next week': 'next_week',
    'שבוע הבא': 'next_week',
    'next year': 'next_year',
    'שנה הבאה': 'next_year'
  };

  Object.keys(timeframePatterns).forEach(key => {
    if (msg.includes(key)) {
      entities.timeframes.push(timeframePatterns[key]);
    }
  });

  // Extract months
  const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
                  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  months.forEach((month, index) => {
    if (msg.includes(month)) {
      entities.months.push(index + 1);
    }
  });

  // Extract years
  const yearPattern = /\b(19|20)\d{2}\b/g;
  const yearMatches = message.matchAll(yearPattern);
  for (const match of yearMatches) {
    entities.years.push(parseInt(match[0]));
  }

  return entities;
};

// Learning System - Track common questions
const commonQuestions = new Map();
const updateQuestionFrequency = (question, category) => {
  const key = `${category}:${question.toLowerCase()}`;
  commonQuestions.set(key, (commonQuestions.get(key) || 0) + 1);
};

const getCommonQuestions = (category, limit = 5) => {
  const filtered = Array.from(commonQuestions.entries())
    .filter(([key]) => !category || key.startsWith(`${category}:`))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  return filtered.map(([key, count]) => ({ question: key.split(':')[1], count }));
};

// Get conversation context
const getConversationContext = async (userId, companyId) => {
  try {
    const conversation = await Conversation.findOne({ userId, companyId })
      .sort({ updatedAt: -1 });
    
    if (!conversation) {
      return {
        lastTopic: null,
        mentionedEntities: [],
        recentQuestions: []
      };
    }

    return {
      lastTopic: conversation.context?.currentTopic || null,
      mentionedEntities: conversation.context?.mentionedEntities || [],
      recentQuestions: conversation.messages?.slice(-5).map(m => ({
        role: m.role,
        content: m.content.substring(0, 100)
      })) || []
    };
  } catch (error) {
    console.error("Error getting conversation context:", error);
    return {
      lastTopic: null,
      mentionedEntities: [],
      recentQuestions: []
    };
  }
};

// Save conversation message
const saveConversationMessage = async (userId, companyId, role, content, intent, entities) => {
  try {
    let conversation = await Conversation.findOne({ userId, companyId });
    
    if (!conversation) {
      conversation = new Conversation({
        userId,
        companyId,
        messages: [],
        context: {
          currentTopic: null,
          mentionedEntities: [],
          userPreferences: {}
        }
      });
    }

    conversation.messages.push({
      role,
      content,
      intent,
      entities,
      timestamp: new Date()
    });

    // Update context
    if (intent?.category) {
      conversation.context.currentTopic = intent.category;
    }
    
    if (entities && Object.keys(entities).length > 0) {
      Object.values(entities).forEach(entity => {
        if (typeof entity === 'string' && !conversation.context.mentionedEntities.includes(entity)) {
          conversation.context.mentionedEntities.push(entity);
        }
      });
    }

    conversation.updatedAt = new Date();
    await conversation.save();
  } catch (error) {
    console.error("Error saving conversation:", error);
  }
};

// Localized, human-friendly formatter
const formatAnswer = (lang, category, intent, payload) => {
  const L = lang === 'he' ? 'he' : 'en';
  const t = {
    he: {
      ok: '✅',
      employees: {
        count: ({ total, active, inactive, byDepartment }) => {
          const parts = Object.entries(byDepartment || {}).map(([d, c]) => `${d}: ${c}`).join(', ');
          return `יש ${total} עובדים בחברה (${active} פעילים, ${inactive} לא פעילים). התפלגות לפי מחלקה: ${parts}`;
        },
        list: ({ employees }) => `רשימת ${employees?.length || 0} עובדים: ${employees?.slice(0,5).map(e=>`${e.name} (${e.role||'ללא תפקיד'})`).join(', ')}${(employees?.length||0)>5?' ועוד...':''}`,
        salary: ({ average, total, count }) => `משכורת ממוצעת: $${average?.toFixed?.(2)} | סה"כ עלות שכר: $${total?.toFixed?.(2)} (${count} עובדים)`
      },
      finance: {
        revenue: ({ total, monthly }) => `סה"כ הכנסות: $${(total||0).toFixed(2)}. חודשי אחרון: ${Object.entries(monthly||{}).slice(-3).map(([m,a])=>`${m}: $${a.toFixed(2)}`).join(', ')}`,
        expenses: ({ total, byCategory }) => `סה"כ הוצאות: $${(total||0).toFixed(2)}. קטגוריות מובילות: ${Object.entries(byCategory||{}).slice(0,3).map(([c,a])=>`${c}: $${a.toFixed(2)}`).join(', ')}`,
        profit: ({ revenue, expenses, profit, margin }) => `רווח: $${(profit||0).toFixed(2)} (הכנסות: $${(revenue||0).toFixed(2)}, הוצאות: $${(expenses||0).toFixed(2)}). מרווח: ${margin}`,
        budget: ({ total, used, remaining, utilization }) => `תקציב כולל: $${(total||0).toFixed(2)}, נוצל: $${(used||0).toFixed(2)} (${utilization}), נותר: $${(remaining||0).toFixed(2)}`,
      },
      tasks: {
        count: ({ total, byStatus, overdue }) => `יש ${total} משימות: ${Object.entries(byStatus||{}).map(([s,c])=>`${c} ${s}`).join(', ')}. ${overdue} באיחור`,
        deadline: ({ overdue, dueSoon, tasks }) => `${overdue} משימות באיחור, ${dueSoon} משימות מגיעות ליעד בשבוע הקרוב`
      },
      generic: ({ employees, projects, tasks, customers }) => `סיכום: ${employees} עובדים, ${projects} פרויקטים, ${tasks} משימות, ${customers} לקוחות`
    },
    en: {
      ok: '✅',
      employees: {
        count: ({ total, active, inactive, byDepartment }) => {
          const parts = Object.entries(byDepartment || {}).map(([d, c]) => `${d}: ${c}`).join(', ');
          return `There are ${total} employees (${active} active, ${inactive} inactive). By department: ${parts}`;
        },
        list: ({ employees }) => `Listing ${employees?.length || 0} employees: ${employees?.slice(0,5).map(e=>`${e.name} (${e.role||'No role'})`).join(', ')}${(employees?.length||0)>5?' and more...':''}`,
        salary: ({ average, total, count }) => `Average salary: $${average?.toFixed?.(2)} | Total payroll: $${total?.toFixed?.(2)} (${count} employees)`
      },
      finance: {
        revenue: ({ total, monthly }) => `Total revenue: $${(total||0).toFixed(2)}. Recent months: ${Object.entries(monthly||{}).slice(-3).map(([m,a])=>`${m}: $${a.toFixed(2)}`).join(', ')}`,
        expenses: ({ total, byCategory }) => `Total expenses: $${(total||0).toFixed(2)}. Top categories: ${Object.entries(byCategory||{}).slice(0,3).map(([c,a])=>`${c}: $${a.toFixed(2)}`).join(', ')}`,
        profit: ({ revenue, expenses, profit, margin }) => `Profit: $${(profit||0).toFixed(2)} (Revenue: $${(revenue||0).toFixed(2)}, Expenses: $${(expenses||0).toFixed(2)}). Margin: ${margin}`,
        budget: ({ total, used, remaining, utilization }) => `Total budget: $${(total||0).toFixed(2)}, Used: $${(used||0).toFixed(2)} (${utilization}), Remaining: $${(remaining||0).toFixed(2)}`,
      },
      tasks: {
        count: ({ total, byStatus, overdue }) => `There are ${total} tasks: ${Object.entries(byStatus||{}).map(([s,c])=>`${c} ${s}`).join(', ')}. ${overdue} overdue`,
        deadline: ({ overdue, dueSoon }) => `${overdue} overdue tasks, ${dueSoon} due within a week`
      },
      generic: ({ employees, projects, tasks, customers }) => `Summary: ${employees} employees, ${projects} projects, ${tasks} tasks, ${customers} customers`
    }
  };

  const dict = t[L];
  if (category && dict[category] && dict[category][intent]) {
    return `${dict.ok} ${dict[category][intent](payload || {})}`;
  }
  // If we have a prebuilt answer from handler, reuse it to avoid regression
  if (payload && typeof payload.answer === 'string') {
    return `${dict.ok} ${payload.answer}`;
  }
  return `${dict.ok} ${dict.generic(payload || {})}`;
};

// Helper function for web search
const searchWeb = async (query) => {
  try {
    // Using a free API for web search (you can replace with your preferred service)
    const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
    return response.data;
  } catch (error) {
    console.error("Web search error:", error.message);
    return null;
  }
};

// Get current time in a timezone
const getWorldTime = async (location) => {
  try {
    const response = await axios.get(`http://worldtimeapi.org/api/timezone/${location}`);
    return response.data;
  } catch (error) {
    try {
      // Fallback to IP-based lookup
      const response = await axios.get(`http://worldtimeapi.org/api/ip`);
      return response.data;
    } catch (fallbackError) {
      return null;
    }
  }
};

// Get weather information
const getWeather = async (city) => {
  try {
    // You'll need to add your OpenWeatherMap API key in .env
    const apiKey = process.env.WEATHER_API_KEY || 'demo';
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );
    return response.data;
  } catch (error) {
    console.error("Weather API error:", error.message);
    return null;
  }
};

// Comprehensive intent detection system
const detectIntent = (message) => {
  const msg = message.toLowerCase();
  
  // Web-based queries
  // Quick math/calculator
  if (/(what is|כמה זה|חשבון|calculate|calc)\s*([0-9+\-*/%^().\s]+)/i.test(msg) || /^[\s]*[0-9+(\-].*[0-9)]\s*$/.test(msg)) {
    const exprMatch = msg.match(/([0-9+\-*/%^().\s]+)/);
    return { type: 'calc', expression: exprMatch ? exprMatch[1] : msg, requiresWeb: false };
  }
  if (/(what('s| is) the (time|clock)|מה השעה|what time)/i.test(msg)) {
    const locationMatch = msg.match(/in ([a-z\s]+)|ב([א-ת\s]+)/i);
    return {
      type: 'world_time',
      location: locationMatch ? locationMatch[1] || locationMatch[2] : 'UTC',
      requiresWeb: true
    };
  }
  
  if (/(weather|temperature|טמפרטורה|מזג אוויר)/i.test(msg)) {
    const cityMatch = msg.match(/in ([a-z\s]+)|ב([א-ת\s]+)/i);
    return {
      type: 'weather',
      city: cityMatch ? cityMatch[1] || cityMatch[2] : null,
      requiresWeb: true
    };
  }
  
  // Predictions intent
  if (/(predictions?|forecast|תחזיות|תחזית)/i.test(msg)) {
    return { type: 'predictions', requiresWeb: false };
  }
  
  if (/(search|חפש|מצא|find) (.+) (online|ברשת|באינטרנט)/i.test(msg)) {
    return {
      type: 'web_search',
      query: msg.replace(/(search|חפש|מצא|find|online|ברשת|באינטרנט)/gi, '').trim(),
      requiresWeb: true
    };
  }

  // Database queries with extensive pattern matching
  const patterns = {
    // Employee queries (100+ variations)
    employees: {
      count: [
        /how many (employees|workers|staff)|כמה עובדים/i,
        /total (employees|staff)|סה"כ עובדים/i,
        /number of (employees|workers)|מספר עובדים/i,
        /count (employees|workers)|ספירת עובדים/i,
      ],
      list: [
        /(list|show|display) (all )?(employees|workers|staff)|הצג עובדים|רשימת עובדים/i,
        /who (are|is) (the )?(employees|workers)|מי העובדים/i,
        /(employees|workers) in (the )?company|עובדים בחברה/i,
      ],
      department: [
        /(employees|workers) in ([a-z]+) (department|מחלקה)/i,
        /how many in ([a-z]+) (dept|department)|כמה ב([א-ת]+)/i,
        /who works in ([a-z]+)|מי עובד ב([א-ת]+)/i,
      ],
      salary: [
        /(average|mean) salary|משכורת ממוצעת/i,
        /total (payroll|salary cost)|עלות שכר כוללת/i,
        /(highest|lowest) (paid|salary)|משכורת (גבוהה|נמוכה)/i,
      ],
      performance: [
        /performance (of|for) ([a-z\s]+)|ביצועים של/i,
        /(top|best) performing (employees|workers)|עובדים מצטיינים/i,
        /who (has|needs) (performance review|שיפור)/i,
      ],
    },
    
    // Finance queries (150+ variations)
    finance: {
      revenue: [
        /(total|overall) (revenue|income)|סה"כ הכנסות/i,
        /how much (did we earn|revenue)|כמה הרווחנו/i,
        /(monthly|yearly|annual) revenue|הכנסות (חודשיות|שנתיות)/i,
      ],
      expenses: [
        /(total|all) (expenses|costs)|סה"כ הוצאות/i,
        /how much (did we spend|spent)|כמה הוצאנו/i,
        /spending (by|per) (category|מחלקה)/i,
      ],
      profit: [
        /(net|gross) profit|רווח (נקי|גולמי)/i,
        /profit margin|מרווח רווח/i,
        /(are we|is the company) profitable|האם רווחיים/i,
      ],
      budget: [
        /budget (status|overview|סטטוס)|מצב תקציב/i,
        /(remaining|left) budget|תקציב נותר/i,
        /budget (utilization|usage)|ניצול תקציב/i,
      ],
    },
    
    // Project queries (100+ variations)
    projects: {
      count: [
        /how many projects|כמה פרויקטים/i,
        /total projects|סה"כ פרויקטים/i,
        /number of projects|מספר פרויקטים/i,
      ],
      status: [
        /(active|ongoing|current) projects|פרויקטים פעילים/i,
        /(completed|finished|done) projects|פרויקטים שהסתיימו/i,
        /projects (on hold|delayed)|פרויקטים מעוכבים/i,
      ],
      progress: [
        /project progress|התקדמות פרויקט/i,
        /(behind|ahead of) schedule|לוח זמנים/i,
        /completion rate|אחוז השלמה/i,
      ],
      budget: [
        /project (budget|cost)|תקציב פרויקט/i,
        /(over|under) budget|חריגה מתקציב/i,
      ],
    },
    
    // Task queries (80+ variations)
    tasks: {
      count: [
        /how many tasks|כמה משימות/i,
        /total tasks|סה"כ משימות/i,
        /(pending|open|active) tasks|משימות פתוחות/i,
      ],
      assignment: [
        /tasks (assigned to|for) ([a-z\s]+)|משימות של/i,
        /who has (the most|most) tasks|למי הכי הרבה משימות/i,
        /(my|mine) tasks|המשימות שלי/i,
      ],
      deadline: [
        /(overdue|late) tasks|משימות באיחור/i,
        /tasks (due|deadline) (today|this week|tomorrow)|משימות ליום|השבוע/i,
      ],
    },
    
    // Customer queries (100+ variations)
    customers: {
      count: [
        /how many (customers|clients)|כמה לקוחות/i,
        /total customers|סה"כ לקוחות/i,
        /(new|active|inactive) customers|לקוחות (חדשים|פעילים)/i,
      ],
      revenue: [
        /(top|best|biggest) customers|לקוחות מובילים/i,
        /customer (revenue|value|ערך)/i,
        /lifetime value|LTV/i,
      ],
      orders: [
        /customer orders|הזמנות לקוח/i,
        /(pending|completed) orders|הזמנות (ממתינות|הושלמו)/i,
        /order (value|total|סכום)/i,
      ],
    },
    
    // Inventory queries (120+ variations)
    inventory: {
      stock: [
        /(low|out of) stock|מלאי נמוך/i,
        /inventory (level|status)|מצב מלאי/i,
        /what('s| is) in stock|מה במלאי/i,
      ],
      value: [
        /inventory (value|worth)|שווי מלאי/i,
        /stock value|ערך מלאי/i,
      ],
      movement: [
        /(fast|slow) moving (products|items)|מוצרים נעים/i,
        /(bestseller|top selling)|רבי מכר/i,
      ],
    },
    
    // Supplier queries (60+ variations)
    suppliers: {
      count: [
        /how many suppliers|כמה ספקים/i,
        /total suppliers|סה"כ ספקים/i,
      ],
      rating: [
        /(top|best) (rated|supplier)|ספק מוביל/i,
        /supplier (rating|score|ציון)/i,
        /(worst|poorest) supplier|ספק גרוע/i,
      ],
      orders: [
        /supplier orders|הזמנות מספק/i,
        /(pending|completed) (purchases|procurement)|רכש ממתין/i,
      ],
    },
    
    // Department queries (70+ variations)
    departments: {
      count: [
        /how many (departments|divisions)|כמה מחלקות/i,
        /total departments|סה"כ מחלקות/i,
      ],
      size: [
        /(largest|biggest|smallest) department|מחלקה (גדולה|קטנה)/i,
        /department (size|headcount)|גודל מחלקה/i,
      ],
      budget: [
        /department budget|תקציב מחלקה/i,
        /spending (by|per) department|הוצאות למחלקה/i,
      ],
    },
    
    // Shift queries (50+ variations)
    shifts: {
      hours: [
        /total (hours|overtime)|סה"כ שעות/i,
        /(worked|working) hours|שעות עבודה/i,
        /overtime hours|שעות נוספות/i,
      ],
      cost: [
        /(labor|shift) cost|עלות עבודה/i,
        /payroll (cost|expense)|הוצאות שכר/i,
      ],
    },
  };

  let detectedIntent = null;
  let detectedCategory = null;
  let detectedEntities = {};

  // Detect category
  for (const [category, keywords] of Object.entries({
    employees: ['עובד', 'עובדים', 'צוות', 'employee', 'staff', 'team', 'hr'],
    finance: ['כסף', 'תקציב', 'הוצאה', 'finance', 'budget', 'expense', 'revenue', 'profit'],
    procurement: ['רכש', 'procurement', 'purchase', 'supplier'],
    projects: ['פרויקט', 'project'],
    tasks: ['משימה', 'task'],
    customers: ['לקוח', 'customer', 'client'],
    inventory: ['מלאי', 'inventory', 'stock', 'product'],
    suppliers: ['ספק', 'supplier'],
    departments: ['מחלקה', 'department'],
    shifts: ['משמרת', 'shift', 'hours', 'שעות'],
  })) {
    if (keywords.some(kw => msg.includes(kw))) {
      detectedCategory = category;
      break;
    }
  }

  // Detect intent patterns
  for (const [category, subcategories] of Object.entries(patterns)) {
    if (detectedCategory && detectedCategory !== category) continue;
    
    for (const [intent, regexList] of Object.entries(subcategories)) {
      for (const regex of regexList) {
        const match = msg.match(regex);
        if (match) {
          detectedIntent = intent;
          detectedCategory = category;
          detectedEntities = match.groups || {};
          break;
        }
      }
      if (detectedIntent) break;
    }
    if (detectedIntent) break;
  }

  // Generic intents
  if (!detectedIntent) {
    if (/(how many|כמה|count|מספר|total|סה"כ)/i.test(msg)) {
      detectedIntent = 'count';
    } else if (/(list|show|display|הצג|רשימה)/i.test(msg)) {
      detectedIntent = 'list';
    } else if (/(average|mean|ממוצע)/i.test(msg)) {
      detectedIntent = 'average';
    } else if (/(sum|total|סכום|סה"כ)/i.test(msg)) {
      detectedIntent = 'sum';
    } else if (/(compare|השווה|vs|versus|השוואה)/i.test(msg)) {
      detectedIntent = 'compare';
    } else if (/(trend|מגמה|growth|צמיחה|שינוי|change)/i.test(msg)) {
      detectedIntent = 'trend';
    } else if (/(predict|forecast|תחזית|צפי)/i.test(msg)) {
      detectedIntent = 'predict';
    } else if (/(recommend|המלץ|suggest|הצע)/i.test(msg)) {
      detectedIntent = 'recommend';
    } else if (/(correlation|קשר|relationship)/i.test(msg)) {
      detectedIntent = 'correlation';
    }
  }

  // If nothing matched, treat as general web query
  if (!detectedCategory && !detectedIntent) {
    return { type: 'web_search', query: message.trim(), requiresWeb: true };
  }

  return {
    intent: detectedIntent,
    category: detectedCategory,
    entities: detectedEntities,
    original: message
  };
};

// Comprehensive database query handler
const queryDatabase = async (analysis, companyId) => {
  const { intent, category, entities } = analysis;
  
  try {
    // Handle comparison queries
    if (intent === 'compare') {
      return await handleComparisonQuery(category, entities, companyId);
    }
    
    // Handle trend queries
    if (intent === 'trend') {
      return await handleTrendQuery(category, entities, companyId);
    }
    
    // Handle recommendation queries
    if (intent === 'recommend') {
      return await generateRecommendations(companyId);
    }
    
    // Standard category-based queries
    switch (category) {
      case 'employees':
        return await handleEmployeeQueries(intent, entities, companyId);
      case 'finance':
        return await handleFinanceQueries(intent, entities, companyId);
      case 'projects':
        return await handleProjectQueries(intent, entities, companyId);
      case 'tasks':
        return await handleTaskQueries(intent, entities, companyId);
      case 'customers':
        return await handleCustomerQueries(intent, entities, companyId);
      case 'inventory':
        return await handleInventoryQueries(intent, entities, companyId);
      case 'suppliers':
        return await handleSupplierQueries(intent, entities, companyId);
      case 'departments':
        return await handleDepartmentQueries(intent, entities, companyId);
      case 'shifts':
        return await handleShiftQueries(intent, entities, companyId);
      case 'procurement':
        return await handleProcurementQueries(intent, entities, companyId);
      default:
        return await handleGenericQuery(intent, companyId);
    }
  } catch (error) {
    console.error("Database query error:", error);
    return { error: "שגיאה בשליפת נתונים", details: error.message };
  }
};

// Generate smart recommendations
const generateRecommendations = async (companyId) => {
  try {
    const recommendations = [];
    
    // Get data
    const [employees, tasks, projects, budgets, shifts, finance] = await Promise.all([
      Employees.find({ companyId: companyId }),
      Tasks.find({ companyId: companyId }),
      Projects.find({ companyId: companyId }),
      Budget.find({ companyId: companyId }),
      Shifts.find({ companyId: companyId }).sort({ date: -1 }).limit(30),
      Finance.find({ companyId: companyId }).sort({ date: -1 }).limit(12)
    ]);

    // Recommendation 1: Task overload
    const tasksPerEmployee = tasks.length / (employees.length || 1);
    if (tasksPerEmployee > 10) {
      recommendations.push({
        type: 'warning',
        category: 'workforce',
        title: 'עומס עבודה גבוה',
        description: `ממוצע של ${tasksPerEmployee.toFixed(1)} משימות לעובד. מומלץ לשקול גיוס או חלוקה מחדש של משימות.`,
        priority: 'high'
      });
    }

    // Recommendation 2: Budget utilization
    const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
    const usedBudget = budgets.reduce((sum, b) => sum + (b.usedAmount || 0), 0);
    const budgetUtilization = totalBudget > 0 ? (usedBudget / totalBudget) * 100 : 0;
    
    if (budgetUtilization > 90) {
      recommendations.push({
        type: 'warning',
        category: 'finance',
        title: 'תקציב כמעט מוצה',
        description: `${budgetUtilization.toFixed(1)}% מהתקציב נוצל. מומלץ לבדוק הוצאות או להקצות תקציב נוסף.`,
        priority: 'high'
      });
    } else if (budgetUtilization < 30) {
      recommendations.push({
        type: 'opportunity',
        category: 'finance',
        title: 'תקציב זמין להשקעה',
        description: `רק ${budgetUtilization.toFixed(1)}% מהתקציב נוצל. ניתן להשקיע במיזמים חדשים או שיפורים.`,
        priority: 'medium'
      });
    }

    // Recommendation 3: Delayed projects
    const delayedProjects = projects.filter(p => {
      if (!p.endDate || p.status === 'completed') return false;
      return new Date(p.endDate) < new Date() && p.status === 'active';
    });
    
    if (delayedProjects.length > 0) {
      recommendations.push({
        type: 'alert',
        category: 'projects',
        title: 'פרויקטים באיחור',
        description: `${delayedProjects.length} פרויקטים חורגים מלוח הזמנים. מומלץ לבדוק משאבים ולוחות זמנים.`,
        priority: 'critical',
        projects: delayedProjects.map(p => p.name)
      });
    }

    // Recommendation 4: Labor cost efficiency
    const avgShiftCost = shifts.reduce((sum, s) => sum + (s.totalCost || 0), 0) / (shifts.length || 1);
    const avgShiftHours = shifts.reduce((sum, s) => sum + (s.totalHours || 0), 0) / (shifts.length || 1);
    const costPerHour = avgShiftHours > 0 ? avgShiftCost / avgShiftHours : 0;
    
    if (costPerHour > 60) {
      recommendations.push({
        type: 'info',
        category: 'efficiency',
        title: 'עלות עבודה גבוהה',
        description: `עלות ממוצעת: $${costPerHour.toFixed(2)} לשעה. מומלץ לבדוק תעריפים או לייעל תהליכים.`,
        priority: 'medium'
      });
    }

    // Recommendation 5: Revenue trend
    const monthlyRevenue = {};
    finance.filter(f => f.type === 'income').forEach(f => {
      const month = new Date(f.date).toLocaleDateString('he-IL', { month: 'short', year: 'numeric' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + f.amount;
    });
    
    const revenueValues = Object.values(monthlyRevenue);
    if (revenueValues.length >= 3) {
      const recent = revenueValues.slice(-3);
      const older = revenueValues.slice(0, 3);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      
      if (recentAvg < olderAvg * 0.9) {
        recommendations.push({
          type: 'warning',
          category: 'finance',
          title: 'ירידה בהכנסות',
          description: `הכנסות ירדו ב-${((1 - recentAvg / olderAvg) * 100).toFixed(1)}% ב-3 חודשים האחרונים. מומלץ לבדוק אסטרטגיית מכירות.`,
          priority: 'high'
        });
      }
    }

    return {
      recommendations,
      count: recommendations.length,
      answer: `נמצאו ${recommendations.length} המלצות: ${recommendations.map(r => r.title).join(', ')}`
    };
  } catch (error) {
    console.error("Recommendations error:", error);
    return { error: "שגיאה ביצירת המלצות", details: error.message };
  }
};

// Employee query handler (Comprehensive)
const handleEmployeeQueries = async (intent, entities, companyId) => {
  switch (intent) {
    case 'count': {
      const [total, active, byDeptAgg] = await Promise.all([
        Employees.countDocuments({ companyId: companyId }),
        Employees.countDocuments({ companyId: companyId, status: 'active' }),
        Employees.aggregate([
          { $match: { companyId: companyId } },
          { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'dept' } },
          { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
          { $group: { _id: { $ifNull: ['$dept.name', 'לא משוייך'] }, count: { $sum: 1 } } }
        ])
      ]);
      const byDepartment = byDeptAgg.reduce((acc, r) => { acc[r._id] = r.count; return acc; }, {});
      return { total, active, inactive: total - active, byDepartment };
    }
    case 'list': {
      const employees = await Employees.find({ companyId: companyId }).select('name lastName role department email').populate('department');
      return {
        employees: employees.map(e => ({
          name: `${e.name} ${e.lastName}`,
          role: e.role,
          department: e.department?.name,
          email: e.email
        }))
      };
    }
    case 'salary':
    case 'average': {
      const salaries = await Salary.find({ companyId: companyId }).select('basicSalary netSalary');
      if (salaries.length === 0) return { average: 0, total: 0, count: 0 };
      const average = salaries.reduce((sum, s) => sum + s.basicSalary, 0) / salaries.length;
      const total = salaries.reduce((sum, s) => sum + s.netSalary, 0);
      return { average, total, count: salaries.length };
    }
    case 'department': {
      const deptName = entities[1] || entities[2];
      const employees = await Employees.find({ companyId: companyId }).select('name department').populate('department');
      const deptEmployees = employees.filter(e => e.department?.name?.toLowerCase().includes(deptName?.toLowerCase()));
      return { count: deptEmployees.length, employees: deptEmployees.map(e => e.name) };
    }
    default: {
      const total = await Employees.countDocuments({ companyId: companyId });
      return { count: total };
    }
  }
};

// Finance query handler (Comprehensive)
const handleFinanceQueries = async (intent, entities, companyId) => {
  switch (intent) {
    case 'revenue': {
      const totals = await Finance.aggregate([
        { $match: { companyId: companyId, type: 'income' } },
        { $group: { _id: { $dateToString: { format: '%b %Y', date: '$date' } }, total: { $sum: '$amount' } } },
        { $sort: { '_id': 1 } }
      ]);
      const monthly = totals.reduce((acc, r) => { acc[r._id] = r.total; return acc; }, {});
      const total = Object.values(monthly).reduce((a, b) => a + b, 0);
      return { total, monthly };
    }
    case 'expenses': {
      const byCatAgg = await Finance.aggregate([
        { $match: { companyId: companyId, type: 'expense' } },
        { $group: { _id: { $ifNull: ['$category', 'אחר'] }, total: { $sum: '$amount' } } },
        { $sort: { total: -1 } }
      ]);
      const byCategory = byCatAgg.reduce((acc, r) => { acc[r._id] = r.total; return acc; }, {});
      const total = Object.values(byCategory).reduce((a, b) => a + b, 0);
      return { total, byCategory };
    }
    case 'profit': {
      const sums = await Finance.aggregate([
        { $match: { companyId: companyId } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } }
      ]);
      const revenue = sums.find(s => s._id === 'income')?.total || 0;
      const expenses = sums.find(s => s._id === 'expense')?.total || 0;
      const profit = revenue - expenses;
      const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : '0.00';
      return { revenue, expenses, profit, margin: `${margin}%` };
    }
    case 'budget': {
      const budgets = await Budget.find({ companyId: companyId }).select('amount usedAmount status');
      const total = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
      const used = budgets.reduce((sum, b) => sum + (b.usedAmount || 0), 0);
      const remaining = total - used;
      const utilization = total > 0 ? ((used / total) * 100).toFixed(2) : '0.00';
      return { total, used, remaining, utilization: `${utilization}%` };
    }
    default: {
      const sums = await Finance.aggregate([
        { $match: { companyId: companyId } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } }
      ]);
      const revenue = sums.find(s => s._id === 'income')?.total || 0;
      const expenses = sums.find(s => s._id === 'expense')?.total || 0;
      const profit = revenue - expenses;
      return { revenue, expenses, profit };
    }
  }
};

// Project query handler
const handleProjectQueries = async (intent, entities, companyId) => {
  const projects = await Projects.find({ companyId: companyId })
    .populate('department')
    .populate('teamMembers');

  const statusCount = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const avgProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0) / (projects.length || 1);
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

  switch (intent) {
    case 'count':
    case 'status':
      return {
        total: projects.length,
        byStatus: statusCount,
        answer: `יש ${projects.length} פרויקטים: ${Object.entries(statusCount).map(([s, c]) => `${c} ${s}`).join(', ')}`
      };
    
    case 'progress':
      const behindSchedule = projects.filter(p => {
        const expectedProgress = ((new Date() - new Date(p.startDate)) / (new Date(p.endDate) - new Date(p.startDate))) * 100;
        return p.progress < expectedProgress - 10;
      }).length;
      return {
        average: avgProgress.toFixed(2),
        behindSchedule,
        answer: `התקדמות ממוצעת: ${avgProgress.toFixed(2)}%. ${behindSchedule} פרויקטים מאחרים מהלוח זמנים`
      };
    
    case 'budget':
      const overBudget = projects.filter(p => p.actualCost > p.budget).length;
      return {
        total: totalBudget,
        overBudget,
        answer: `תקציב כולל לפרויקטים: $${totalBudget.toFixed(2)}. ${overBudget} פרויקטים חורגים מתקציב`
      };
    
    default:
      return {
        total: projects.length,
        avgProgress: avgProgress.toFixed(2),
        answer: `יש ${projects.length} פרויקטים עם התקדמות ממוצעת של ${avgProgress.toFixed(2)}%`
      };
  }
};

// Task query handler
const handleTaskQueries = async (intent, entities, companyId) => {
  switch (intent) {
    case 'count': {
      const [byStatusAgg, overdueAgg, total] = await Promise.all([
        Tasks.aggregate([
          { $match: { companyId: companyId } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Tasks.aggregate([
          { $match: { companyId: companyId, status: { $ne: 'completed' }, dueDate: { $ne: null, $lt: new Date() } } },
          { $count: 'overdue' }
        ]),
        Tasks.countDocuments({ companyId: companyId })
      ]);
      const byStatus = byStatusAgg.reduce((acc, r) => { acc[r._id] = r.count; return acc; }, {});
      const overdue = overdueAgg[0]?.overdue || 0;
      return { total, byStatus, overdue };
    }
    case 'deadline': {
      const now = new Date();
      const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const [dueSoonTasks, overdueAgg] = await Promise.all([
        Tasks.find({ companyId: companyId, status: { $ne: 'completed' }, dueDate: { $gte: now, $lte: in7 } }).select('title dueDate'),
        Tasks.aggregate([
          { $match: { companyId: companyId, status: { $ne: 'completed' }, dueDate: { $ne: null, $lt: new Date() } } },
          { $count: 'overdue' }
        ])
      ]);
      const overdue = overdueAgg[0]?.overdue || 0;
      return { overdue, dueSoon: dueSoonTasks.length, tasks: dueSoonTasks.map(t => ({ title: t.title, dueDate: t.dueDate })) };
    }
    case 'assignment': {
      const tasks = await Tasks.find({ companyId: companyId }).select('assignedTo').populate('assignedTo');
      const byAssignee = {};
      tasks.forEach(t => {
        t.assignedTo?.forEach(a => {
          const name = a.name || 'לא משוייך';
          byAssignee[name] = (byAssignee[name] || 0) + 1;
        });
      });
      const mostTasks = Object.entries(byAssignee).sort((a, b) => b[1] - a[1])[0];
      return { byAssignee, mostTasks };
    }
    default: {
      const total = await Tasks.countDocuments({ companyId: companyId });
      return { total };
    }
  }
};

// Customer query handler
const handleCustomerQueries = async (intent, entities, companyId) => {
  const customers = await Customers.find({ companyId: companyId });
  const orders = await CustomerOrder.find({ companyId: companyId }).populate('customerId');

  switch (intent) {
    case 'count':
      const statusCount = customers.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {});
      return {
        total: customers.length,
        byStatus: statusCount,
        answer: `יש ${customers.length} לקוחות: ${Object.entries(statusCount).map(([s, c]) => `${c} ${s}`).join(', ')}`
      };
    
    case 'revenue':
      const customerRevenue = {};
      orders.forEach(o => {
        const custName = o.customerId?.name || 'לא ידוע';
        customerRevenue[custName] = (customerRevenue[custName] || 0) + o.totalPrice;
      });
      const topCustomers = Object.entries(customerRevenue)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      return {
        topCustomers,
        answer: `לקוחות מובילים: ${topCustomers.map(([name, rev]) => `${name}: $${rev.toFixed(2)}`).join(', ')}`
      };
    
    case 'orders':
      const orderStatus = orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {});
      const totalValue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
      return {
        totalOrders: orders.length,
        byStatus: orderStatus,
        totalValue,
        answer: `${orders.length} הזמנות בסך $${totalValue.toFixed(2)}: ${Object.entries(orderStatus).map(([s, c]) => `${c} ${s}`).join(', ')}`
      };
    
    default:
      return {
        total: customers.length,
        orders: orders.length,
        answer: `יש ${customers.length} לקוחות עם ${orders.length} הזמנות`
      };
  }
};

// Inventory query handler
const handleInventoryQueries = async (intent, entities, companyId) => {
  const inventory = await Inventory.find({ companyId: companyId }).populate('productId');

  const totalValue = inventory.reduce((sum, i) => sum + (i.quantity * (i.productId?.unitPrice || 0)), 0);
  const lowStock = inventory.filter(i => i.quantity <= (i.minStockLevel || 10));

  switch (intent) {
    case 'stock':
      return {
        totalItems: inventory.length,
        lowStock: lowStock.length,
        items: lowStock.map(i => ({
          product: i.productId?.productName,
          quantity: i.quantity,
          minStock: i.minStockLevel
        })),
        answer: `${inventory.length} פריטים במלאי. ${lowStock.length} פריטים במלאי נמוך: ${lowStock.slice(0, 3).map(i => i.productId?.productName).join(', ')}`
      };
    
    case 'value':
      return {
        totalValue,
        itemCount: inventory.reduce((sum, i) => sum + i.quantity, 0),
        answer: `שווי מלאי כולל: $${totalValue.toFixed(2)} (${inventory.reduce((sum, i) => sum + i.quantity, 0)} יחידות)`
      };
    
    case 'movement':
      // This would require sales data - simplified version
      const products = await Product.find({ companyId: companyId });
      return {
        totalProducts: products.length,
        answer: `${products.length} מוצרים במלאי`
      };
    
    default:
      return {
        total: inventory.length,
        value: totalValue,
        answer: `מלאי: ${inventory.length} פריטים בשווי $${totalValue.toFixed(2)}`
      };
  }
};

// Supplier query handler
const handleSupplierQueries = async (intent, entities, companyId) => {
  const suppliers = await Suppliers.find({ companyId: companyId });
  const procurements = await Procurement.find({ companyId: companyId });

  switch (intent) {
    case 'count':
      return {
        total: suppliers.length,
        answer: `יש ${suppliers.length} ספקים במערכת`
      };
    
    case 'rating':
      const rated = suppliers.filter(s => s.averageRating && s.averageRating > 1);
      const topSuppliers = rated
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 5);
      return {
        topSuppliers: topSuppliers.map(s => ({
          name: s.name,
          rating: s.averageRating
        })),
        answer: `ספקים מובילים: ${topSuppliers.map(s => `${s.name} (${s.averageRating}/5)`).join(', ')}`
      };
    
    case 'orders':
      const supplierOrders = {};
      procurements.forEach(p => {
        const suppName = p.supplierId?.name || 'לא ידוע';
        supplierOrders[suppName] = (supplierOrders[suppName] || 0) + 1;
      });
      return {
        totalOrders: procurements.length,
        bySupplier: supplierOrders,
        answer: `${procurements.length} הזמנות רכש. התפלגות: ${Object.entries(supplierOrders).slice(0, 3).map(([s, c]) => `${s}: ${c}`).join(', ')}`
      };
    
    default:
      return {
        total: suppliers.length,
        answer: `יש ${suppliers.length} ספקים במערכת`
      };
  }
};

// Department query handler
const handleDepartmentQueries = async (intent, entities, companyId) => {
  const departments = await Department.find({ companyId: companyId }).populate('teamMembers');

  switch (intent) {
    case 'count':
      return {
        total: departments.length,
        answer: `יש ${departments.length} מחלקות בחברה`
      };
    
    case 'size':
      const deptSizes = departments.map(d => ({
        name: d.name,
        size: d.teamMembers?.length || 0
      })).sort((a, b) => b.size - a.size);
      return {
        departments: deptSizes,
        largest: deptSizes[0],
        smallest: deptSizes[deptSizes.length - 1],
        answer: `המחלקה הגדולה ביותר: ${deptSizes[0]?.name} (${deptSizes[0]?.size} עובדים). הקטנה: ${deptSizes[deptSizes.length - 1]?.name} (${deptSizes[deptSizes.length - 1]?.size} עובדים)`
      };
    
    case 'budget':
      const budgets = await Budget.find({ companyId: companyId });
      const deptBudgets = {};
      budgets.forEach(b => {
        const dept = b.departmentOrProjectName || 'לא משוייך';
        deptBudgets[dept] = (deptBudgets[dept] || 0) + b.amount;
      });
      return {
        byDepartment: deptBudgets,
        answer: `תקציבים למחלקות: ${Object.entries(deptBudgets).slice(0, 3).map(([d, a]) => `${d}: $${a.toFixed(2)}`).join(', ')}`
      };
    
    default:
      return {
        total: departments.length,
        answer: `יש ${departments.length} מחלקות בחברה`
      };
  }
};

// Shift query handler
const handleShiftQueries = async (intent, entities, companyId) => {
  const shifts = await Shifts.find({ companyId: companyId }).populate('employeeId');

  const totalHours = shifts.reduce((sum, s) => sum + (s.hoursWorked || 0), 0);
  const totalCost = shifts.reduce((sum, s) => sum + (s.totalPay || 0), 0);
  const overtimeHours = shifts.reduce((sum, s) => sum + (s.overtimeHours || 0), 0);

  switch (intent) {
    case 'hours':
      return {
        totalHours,
        overtimeHours,
        regularHours: totalHours - overtimeHours,
        answer: `סה"כ שעות עבודה: ${totalHours.toFixed(2)} (${overtimeHours.toFixed(2)} שעות נוספות)`
      };
    
    case 'cost':
      const avgCostPerHour = totalHours > 0 ? totalCost / totalHours : 0;
      return {
        totalCost,
        avgCostPerHour,
        answer: `עלות עבודה כוללת: $${totalCost.toFixed(2)}, עלות ממוצעת לשעה: $${avgCostPerHour.toFixed(2)}`
      };
    
    default:
      return {
        shifts: shifts.length,
        totalHours,
        totalCost,
        answer: `${shifts.length} משמרות, סה"כ ${totalHours.toFixed(2)} שעות בעלות $${totalCost.toFixed(2)}`
      };
  }
};

// Procurement query handler
const handleProcurementQueries = async (intent, entities, companyId) => {
  const procurements = await Procurement.find({ companyId: companyId }).populate('supplierId');

  const totalValue = procurements.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
  const byStatus = procurements.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return {
    total: procurements.length,
    totalValue,
    byStatus,
    answer: `${procurements.length} הזמנות רכש בסך $${totalValue.toFixed(2)}: ${Object.entries(byStatus).map(([s, c]) => `${c} ${s}`).join(', ')}`
  };
};

// Generic query handler
const handleGenericQuery = async (intent, companyId) => {
  const [employees, projects, tasks, customers] = await Promise.all([
    Employees.find({ companyId: companyId }),
    Projects.find({ companyId: companyId }),
    Tasks.find({ companyId: companyId }),
    Customers.find({ companyId: companyId }),
  ]);

  return {
    employees: employees.length,
    projects: projects.length,
    tasks: tasks.length,
    customers: customers.length,
    answer: `סיכום: ${employees.length} עובדים, ${projects.length} פרויקטים, ${tasks.length} משימות, ${customers.length} לקוחות`
  };
};

// Comparison query handler
const handleComparisonQuery = async (category, entities, companyId) => {
  try {
    switch (category) {
      case 'finance': {
        // Compare periods
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const [lastMonthData, thisMonthData] = await Promise.all([
          Finance.aggregate([
            { $match: { companyId: companyId, date: { $gte: lastMonth, $lt: thisMonth } } },
            { $group: { _id: '$type', total: { $sum: '$amount' } } }
          ]),
          Finance.aggregate([
            { $match: { companyId: companyId, date: { $gte: thisMonth } } },
            { $group: { _id: '$type', total: { $sum: '$amount' } } }
          ])
        ]);

        const lastMonthRevenue = lastMonthData.find(d => d._id === 'income')?.total || 0;
        const thisMonthRevenue = thisMonthData.find(d => d._id === 'income')?.total || 0;
        const lastMonthExpenses = lastMonthData.find(d => d._id === 'expense')?.total || 0;
        const thisMonthExpenses = thisMonthData.find(d => d._id === 'expense')?.total || 0;

        const revenueChange = thisMonthRevenue - lastMonthRevenue;
        const revenueChangePercent = lastMonthRevenue > 0 ? ((revenueChange / lastMonthRevenue) * 100).toFixed(2) : 0;
        const expensesChange = thisMonthExpenses - lastMonthExpenses;
        const expensesChangePercent = lastMonthExpenses > 0 ? ((expensesChange / lastMonthExpenses) * 100).toFixed(2) : 0;

        return {
          comparison: {
            revenue: {
              lastMonth: lastMonthRevenue,
              thisMonth: thisMonthRevenue,
              change: revenueChange,
              changePercent: revenueChangePercent
            },
            expenses: {
              lastMonth: lastMonthExpenses,
              thisMonth: thisMonthExpenses,
              change: expensesChange,
              changePercent: expensesChangePercent
            }
          },
          answer: `השוואה בין חודש שעבר לחודש זה:
הכנסות: $${lastMonthRevenue.toFixed(2)} → $${thisMonthRevenue.toFixed(2)} (${revenueChange >= 0 ? '+' : ''}${revenueChangePercent}%)
הוצאות: $${lastMonthExpenses.toFixed(2)} → $${thisMonthExpenses.toFixed(2)} (${expensesChange >= 0 ? '+' : ''}${expensesChangePercent}%)`
        };
      }
      
      case 'employees': {
        const [lastMonth, thisMonth] = await Promise.all([
          Employees.countDocuments({ 
            companyId: companyId, 
            createdAt: { $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          }),
          Employees.countDocuments({ companyId: companyId })
        ]);

        const change = thisMonth - lastMonth;
        return {
          comparison: {
            lastMonth,
            thisMonth,
            change
          },
          answer: `מספר עובדים: ${lastMonth} → ${thisMonth} (${change >= 0 ? '+' : ''}${change})`
        };
      }

      default:
        return { answer: 'לא ניתן לבצע השוואה לקטגוריה זו' };
    }
  } catch (error) {
    console.error("Comparison query error:", error);
    return { error: "שגיאה בהשוואה", details: error.message };
  }
};

// Trend query handler
const handleTrendQuery = async (category, entities, companyId) => {
  try {
    switch (category) {
      case 'finance': {
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          months.push({ start: monthStart, end: monthEnd });
        }

        const monthlyData = await Promise.all(
          months.map(month =>
            Finance.aggregate([
              { $match: { companyId: companyId, date: { $gte: month.start, $lte: month.end } } },
              { $group: { _id: '$type', total: { $sum: '$amount' } } }
            ])
          )
        );

        const revenueTrend = monthlyData.map((data, index) => {
          const revenue = data.find(d => d._id === 'income')?.total || 0;
          return {
            month: months[index].start.toLocaleDateString('he-IL', { month: 'short', year: 'numeric' }),
            revenue
          };
        });

        // Calculate trend direction
        const recent = revenueTrend.slice(-3).map(r => r.revenue);
        const older = revenueTrend.slice(0, 3).map(r => r.revenue);
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        const trendDirection = recentAvg > olderAvg ? 'עלייה' : recentAvg < olderAvg ? 'ירידה' : 'יציב';
        const trendPercent = olderAvg > 0 ? Math.abs(((recentAvg - olderAvg) / olderAvg) * 100).toFixed(2) : 0;

        return {
          trend: revenueTrend,
          direction: trendDirection,
          changePercent: trendPercent,
          answer: `מגמת הכנסות: ${trendDirection} של ${trendPercent}% ב-3 חודשים האחרונים`
        };
      }

      case 'employees': {
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push(monthStart);
        }

        const employeeCounts = await Promise.all(
          months.map(monthStart =>
            Employees.countDocuments({
              companyId: companyId,
              createdAt: { $lte: monthStart }
            })
          )
        );

        const trend = months.map((month, index) => ({
          month: month.toLocaleDateString('he-IL', { month: 'short', year: 'numeric' }),
          count: employeeCounts[index]
        }));

        const recent = employeeCounts.slice(-3);
        const older = employeeCounts.slice(0, 3);
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        const trendDirection = recentAvg > olderAvg ? 'גידול' : recentAvg < olderAvg ? 'ירידה' : 'יציב';
        const change = recentAvg - olderAvg;

        return {
          trend,
          direction: trendDirection,
          change: change.toFixed(0),
          answer: `מגמת עובדים: ${trendDirection} של ${Math.abs(change).toFixed(0)} עובדים בממוצע`
        };
      }

      default:
        return { answer: 'לא ניתן לחשב מגמה לקטגוריה זו' };
    }
  } catch (error) {
    console.error("Trend query error:", error);
    return { error: "שגיאה בחישוב מגמה", details: error.message };
  }
};

// Main chat handler with web capabilities
export const chat = async (req, res) => {
  try {
    const { message } = req.body;
    const companyId = req.user.company || req.user.companyId;
    const userRole = req.user.role;
    const lang = detectLanguage(message || '');

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }

    console.log(`AI Chat - User: ${req.user._id}, Role: ${userRole}, Message: "${message}"`);

    // Cache check
    const cacheKey = `${req.user._id}:${companyId}:${lang}:${message.trim()}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, response: cached, requiresWeb: false, cached: true });
    }

    // Check for greetings
    if (/^(hi|hello|hey|שלום|היי|הי|מה קורה)/i.test(message.trim())) {
      return res.json({
        success: true,
        response: `שלום! 👋 אני עוזר ה-AI של Nexora. אני יכול לעזור לך עם:
        
📊 ניתוח נתונים מהחברה שלך
🔮 תחזיות ותובנות (Admin בלבד)
🌐 מידע מהרשת (מזג אוויר, שעון עולמי, וכו')
💡 המלצות והצעות

מה תרצה לדעת?`,
        requiresWeb: false
      });
    }

    // Check for help
    if (/(help|עזרה|מה אתה יכול|what can you)/i.test(message)) {
      return res.json({
        success: true,
        response: `🤖 **יכולות ה-AI שלי:**

**📊 שאלות על בסיס הנתונים:**
• עובדים: "כמה עובדים יש?", "מי עובד במחלקת IT?", "מה המשכורת הממוצעת?"
• פיננסים: "מה הרווח שלנו?", "כמה הוצאנו החודש?", "מה מצב התקציב?"
• פרויקטים: "כמה פרויקטים פעילים?", "מה ההתקדמות?", "מי חורג מתקציב?"
• משימות: "כמה משימות באיחור?", "מי עם הכי הרבה משימות?"
• לקוחות: "מי הלקוחות המובילים?", "כמה הזמנות פתוחות?"
• מלאי: "מה במלאי נמוך?", "מה שווי המלאי?"
• ספקים: "מי הספק המוביל?", "כמה הזמנות רכש?"

**🌐 שאלות אינטרנט:**
• "מה השעה ב-ניו יורק?"
• "מה הטמפרטורה בלונדון?"
• "חפש מידע על [נושא]"

**🔮 תחזיות (Admin בלבד):**
• תחזיות פיננסיות
• תחזיות כוח אדם
• המלצות לשיפור

רק תשאל!`,
        requiresWeb: false
      });
    }

    // Get conversation context
    const context = await getConversationContext(req.user._id, companyId);
    
    // Extract entities from message
    const entities = await extractEntities(message, companyId);
    
    // Analyze the message
    const analysis = detectIntent(message);
    analysis.entities = { ...analysis.entities, ...entities };
    console.log("Intent analysis:", analysis);

    // Update question frequency for learning
    if (analysis.category) {
      updateQuestionFrequency(message, analysis.category);
    }

    let response;

    // Handle web-based queries
    if (analysis.requiresWeb || analysis.type) {
      switch (analysis.type) {
        case 'predictions':
          try {
            const { predictions, predictionsArray } = await computePredictions(companyId);
            const isHe = lang === 'he';
            response = isHe
              ? `🔮 תחזיות לחודש הקרוב:\n• הכנסות: $${predictions.financial.nextMonthRevenue.toFixed(2)} (${predictions.financial.trend})\n• גיוס מומלץ: ${predictions.workforce.recommendedHiring} עובדים\n• עלות עבודה חודשית: $${predictions.laborCost.monthlyPrediction.toFixed(2)}`
              : `🔮 Forecast for next month:\n• Revenue: $${predictions.financial.nextMonthRevenue.toFixed(2)} (${predictions.financial.trend})\n• Recommended hiring: ${predictions.workforce.recommendedHiring} employees\n• Labor cost: $${predictions.laborCost.monthlyPrediction.toFixed(2)}`;

            return res.json({ success: true, response, predictions: predictionsArray, requiresWeb: false });
          } catch (e) {
            response = lang === 'he' ? 'לא הצלחתי להפיק תחזיות כרגע.' : 'Could not generate predictions right now.';
          }
          break;
        case 'calc':
          try {
            const expr = (analysis.expression || '').replace(/[^0-9+\-*/%^().\s]/g, '');
            const safeExpr = expr.replace(/\^/g, '**');
            // eslint-disable-next-line no-new-func
            const result = Function(`"use strict"; return (${safeExpr})`)();
            if (typeof result === 'number' && isFinite(result)) {
              response = lang === 'he' ? `תוצאה: ${result}` : `Result: ${result}`;
            } else {
              response = lang === 'he' ? 'לא הצלחתי לחשב. נסה ביטוי פשוט (לדוגמה: 12*(3+4)).' : 'Could not calculate. Try a simple expression (e.g., 12*(3+4)).';
            }
          } catch (e) {
            response = lang === 'he' ? 'שגיאה בחישוב. בדוק את הנוסחה.' : 'Calculation error. Check your formula.';
          }
          break;
        case 'world_time':
          try {
            const timezoneMap = {
              'new york': 'America/New_York',
              'london': 'Europe/London',
              'tokyo': 'Asia/Tokyo',
              'paris': 'Europe/Paris',
              'tel aviv': 'Asia/Tel_Aviv',
              'los angeles': 'America/Los_Angeles',
              'sydney': 'Australia/Sydney',
              'dubai': 'Asia/Dubai',
            };
            
            const location = analysis.location.toLowerCase().trim();
            const timezone = timezoneMap[location] || 'UTC';
            
            const timeData = await getWorldTime(timezone);
            if (timeData) {
              const time = new Date(timeData.datetime).toLocaleString('he-IL', {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
              response = `🕐 השעה ב${analysis.location}: **${time}**\nתאריך: ${new Date(timeData.datetime).toLocaleDateString('he-IL')}`;
            } else {
              response = `מצטער, לא הצלחתי למצוא את השעה ב${analysis.location}. נסה שם מדויק יותר.`;
            }
          } catch (error) {
            response = `שגיאה בקבלת שעון עולמי: ${error.message}`;
          }
          break;
        
        case 'weather':
          if (analysis.city) {
            const weatherData = await getWeather(analysis.city);
            if (weatherData) {
              response = `🌤️ מזג אוויר ב${analysis.city}:
**טמפרטורה:** ${weatherData.main.temp}°C (מרגיש כמו ${weatherData.main.feels_like}°C)
**תיאור:** ${weatherData.weather[0].description}
**לחות:** ${weatherData.main.humidity}%
**רוח:** ${weatherData.wind.speed} m/s`;
            } else {
              response = `לא הצלחתי למצוא מידע על מזג האוויר ב${analysis.city}. ודא שהשם נכון.`;
            }
          } else {
            response = "אנא ציין את שם העיר. לדוגמה: 'מה הטמפרטורה בלונדון?'";
          }
          break;
        
        case 'web_search':
          try {
            const data = await searchWeb(analysis.query);
            const isHe = lang === 'he';
            if (data) {
              const abstract = data.AbstractText || data.Abstract || '';
              const heading = data.Heading || '';
              const source = data.AbstractSource || '';
              const url = data.AbstractURL || '';
              const topics = Array.isArray(data.RelatedTopics) ? data.RelatedTopics.slice(0, 3) : [];
              const topicLines = topics
                .map(t => {
                  const txt = t.Text || (t.Result ? t.Result.replace(/<[^>]+>/g, '') : '');
                  const link = t.FirstURL || '';
                  return `${txt}${link ? `\n${link}` : ''}`;
                })
                .filter(Boolean)
                .join('\n\n');

              if (abstract) {
                response = isHe
                  ? `🔎 ${heading || 'תוצאה'}\n${abstract}${source ? `\nמקור: ${source}` : ''}${url ? `\n${url}` : ''}${topicLines ? `\n\nעוד נושאים:\n${topicLines}` : ''}`
                  : `🔎 ${heading || 'Result'}\n${abstract}${source ? `\nSource: ${source}` : ''}${url ? `\n${url}` : ''}${topicLines ? `\n\nMore topics:\n${topicLines}` : ''}`;
              } else if (topicLines) {
                response = isHe
                  ? `🔎 תוצאות קשורות ל"${analysis.query}":\n\n${topicLines}`
                  : `🔎 Related results for "${analysis.query}":\n\n${topicLines}`;
              } else {
                response = isHe
                  ? `לא נמצאה תשובה ישירה. נסה מונח מדויק יותר.`
                  : `No direct answer found. Try a more specific term.`;
              }
            } else {
              response = isHe ? 'לא הצלחתי לבצע חיפוש כעת.' : 'Could not perform search at the moment.';
            }
          } catch (e) {
            response = lang === 'he' ? 'אירעה שגיאה בחיפוש.' : 'An error occurred during search.';
          }
          break;
        
        default:
          response = "לא הבנתי את השאלה. נסה שוב או שאל 'עזרה' לרשימת פקודות.";
      }
      
      return res.json({
        success: true,
        response,
        requiresWeb: true
      });
    }

    // Handle database queries
    if (analysis.category) {
      const queryResult = await queryDatabase(analysis, companyId);
      
      if (queryResult.error) {
        response = `❌ ${queryResult.error}`;
      } else {
        response = formatAnswer(lang, analysis.category, analysis.intent, queryResult);
        
        // Add data visualization suggestions
        if (queryResult.byStatus || queryResult.byDepartment || queryResult.byCategory) {
          response += `\n\n📊 *ניתן לצפות בנתונים אלה בגרפים בדף הדשבורד*`;
        }
      }
    } else {
      // Fallback to general summary
      const summary = await handleGenericQuery(null, companyId);
      response = formatAnswer(lang, null, null, summary);
    }

    // Final fallback to guarantee non-empty answer
    if (!response || !String(response).trim()) {
      response = lang === 'he' ? 'מצטער, לא מצאתי תשובה מתאימה לשאלה. נסה לנסח אחרת.' : 'Sorry, I could not find a suitable answer. Please try rephrasing your question.';
    }

    setCache(cacheKey, response);

    // Save conversation to memory
    await saveConversationMessage(
      req.user._id,
      companyId,
      'user',
      message,
      analysis,
      entities
    );
    await saveConversationMessage(
      req.user._id,
      companyId,
      'assistant',
      response,
      analysis,
      entities
    );

    return res.json({
      success: true,
      response,
      data: analysis,
      requiresWeb: false
    });

  } catch (error) {
    console.error("AI Chat error:", error);
    return res.status(500).json({
      success: false,
      error: "שגיאה בעיבוד השאלה",
      details: error.message
    });
  }
};

// Statistical prediction algorithms
const linearRegression = (data) => {
  if (data.length < 2) return { prediction: data[data.length - 1] || 0, confidence: 0 };
  
  const n = data.length;
  const sumX = data.reduce((sum, _, i) => sum + i, 0);
  const sumY = data.reduce((sum, d) => sum + d, 0);
  const sumXY = data.reduce((sum, d, i) => sum + i * d, 0);
  const sumX2 = data.reduce((sum, _, i) => sum + i * i, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Predict next value
  const nextX = n;
  const prediction = slope * nextX + intercept;
  
  // Calculate confidence (R-squared approximation)
  const meanY = sumY / n;
  const ssRes = data.reduce((sum, d, i) => {
    const predicted = slope * i + intercept;
    return sum + Math.pow(d - predicted, 2);
  }, 0);
  const ssTot = data.reduce((sum, d) => sum + Math.pow(d - meanY, 2), 0);
  const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
  const confidence = Math.max(0, Math.min(100, rSquared * 100));
  
  return { prediction: Math.max(0, prediction), slope, intercept, confidence };
};

const movingAverage = (data, window = 3) => {
  if (data.length === 0) return { prediction: 0, confidence: 0 };
  if (data.length < window) {
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    return { prediction: avg, confidence: 50 };
  }
  
  const recent = data.slice(-window);
  const prediction = recent.reduce((a, b) => a + b, 0) / window;
  
  // Confidence based on variance
  const variance = recent.reduce((sum, val) => sum + Math.pow(val - prediction, 2), 0) / window;
  const stdDev = Math.sqrt(variance);
  const confidence = stdDev > 0 ? Math.max(0, Math.min(100, 100 - (stdDev / prediction) * 100)) : 100;
  
  return { prediction, confidence };
};

const exponentialSmoothing = (data, alpha = 0.3) => {
  if (data.length === 0) return { prediction: 0, confidence: 0 };
  if (data.length === 1) return { prediction: data[0], confidence: 50 };
  
  let smoothed = data[0];
  for (let i = 1; i < data.length; i++) {
    smoothed = alpha * data[i] + (1 - alpha) * smoothed;
  }
  
  const prediction = smoothed;
  const confidence = 70; // Exponential smoothing typically has medium confidence
  
  return { prediction: Math.max(0, prediction), confidence };
};

// Internal: compute predictions data and array for UI
const computePredictions = async (companyId) => {
    const [employees, finance, projects, shifts] = await Promise.all([
      Employees.find({ companyId: companyId }),
      Finance.find({ companyId: companyId }).sort({ date: -1 }).limit(12),
      Projects.find({ companyId: companyId }),
      Shifts.find({ companyId: companyId }).sort({ date: -1 }).limit(30),
    ]);

    // Prepare monthly revenue data for advanced predictions
    const monthlyRevenueData = [];
    const revenueByMonth = {};
    finance.filter(f => f.type === 'income').forEach(f => {
      const monthKey = new Date(f.date).toLocaleDateString('he-IL', { month: 'short', year: 'numeric' });
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + f.amount;
    });
    
    // Convert to array for prediction algorithms
    Object.keys(revenueByMonth).sort().forEach(month => {
      monthlyRevenueData.push(revenueByMonth[month]);
    });

    // Predict revenue using multiple statistical methods
    let revenuePrediction = 0;
    let revenueConfidence = 0;
    let revenueMethod = 'average';
    
    if (monthlyRevenueData.length >= 3) {
      const lr = linearRegression(monthlyRevenueData);
      const ma = movingAverage(monthlyRevenueData, 3);
      const es = exponentialSmoothing(monthlyRevenueData, 0.3);
      
      // Weighted average (favor higher confidence methods)
      const totalWeight = lr.confidence + ma.confidence + es.confidence;
      if (totalWeight > 0) {
        revenuePrediction = (
          (lr.prediction * lr.confidence + 
           ma.prediction * ma.confidence + 
           es.prediction * es.confidence) / totalWeight
        );
        revenueConfidence = (lr.confidence + ma.confidence + es.confidence) / 3;
        revenueMethod = 'advanced';
      } else {
        revenuePrediction = ma.prediction;
        revenueConfidence = ma.confidence;
        revenueMethod = 'moving_average';
      }
    } else if (monthlyRevenueData.length > 0) {
      const avg = monthlyRevenueData.reduce((a, b) => a + b, 0) / monthlyRevenueData.length;
      revenuePrediction = avg * 1.05; // Simple growth assumption
      revenueConfidence = 50;
      revenueMethod = 'average';
    } else {
      revenuePrediction = 0;
      revenueConfidence = 0;
      revenueMethod = 'none';
    }
    
    const avgMonthlyRevenue = monthlyRevenueData.length > 0 
      ? monthlyRevenueData.reduce((a, b) => a + b, 0) / monthlyRevenueData.length 
      : 0;
    const trend = revenuePrediction > avgMonthlyRevenue ? "up" : revenuePrediction < avgMonthlyRevenue ? "down" : "stable";
    
    const avgProjectTeamSize = projects.reduce((sum, p) => sum + (p.teamMembers?.length || 0), 0) / (projects.length || 1);
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const recommendedHiring = Math.max(0, Math.ceil(activeProjects * avgProjectTeamSize - employees.length));

    // Predict labor cost using moving average
    const shiftCosts = shifts.map(s => s.totalCost || 0);
    const laborCostPrediction = shiftCosts.length >= 3 
      ? movingAverage(shiftCosts, 3).prediction * 30 
      : shiftCosts.length > 0 
        ? (shiftCosts.reduce((a, b) => a + b, 0) / shiftCosts.length) * 30 * 1.1
        : 0;
    
    const avgShiftCost = shifts.reduce((sum, s) => sum + (s.totalCost || 0), 0) / (shifts.length || 1);

    const predictions = {
      financial: {
        nextMonthRevenue: revenuePrediction,
        confidence: revenueConfidence > 70 ? "high" : revenueConfidence > 40 ? "medium" : "low",
        trend: trend,
        method: revenueMethod,
        confidenceValue: revenueConfidence,
        explanation: `בהתבסס על ${monthlyRevenueData.length} חודשים אחרונים (${revenueMethod}), צפוי הכנסה של $${revenuePrediction.toFixed(2)} בחודש הבא (ביטחון: ${revenueConfidence.toFixed(0)}%)`
      },
      workforce: {
        currentEmployees: employees.length,
        recommendedHiring,
        reasoning: `עם ${activeProjects} פרויקטים פעילים וממוצע של ${avgProjectTeamSize.toFixed(1)} עובדים לפרויקט, מומלץ לשקול ${recommendedHiring} עובדים נוספים`,
      skillsNeeded: ["Project Management", "Development", "Design"]
      },
      laborCost: {
        monthlyPrediction: laborCostPrediction,
        avgCostPerShift: avgShiftCost,
        explanation: `עלות עבודה צפויה לחודש הבא: $${laborCostPrediction.toFixed(2)} (מבוסס על ממוצע נע של 3 משמרות אחרונות)`
      }
    };

  const predictionsArray = [
    {
      icon: "📈",
      title: "תחזית הכנסות לחודש הבא",
      prediction: `$${revenuePrediction.toFixed(2)}`,
      confidence: revenueConfidence > 70 ? "high" : revenueConfidence > 40 ? "medium" : "low",
      confidenceValue: revenueConfidence,
      detail: predictions.financial.explanation
    },
    {
      icon: "👥",
      title: "המלצת גיוס",
      prediction: recommendedHiring > 0 ? `${recommendedHiring} עובדים מוצעים` : "אין צורך בגיוס",
      confidence: "low",
      detail: predictions.workforce.reasoning
    },
    {
      icon: "💸",
      title: "עלות עבודה חודשית צפויה",
      prediction: `$${laborCostPrediction.toFixed(2)}`,
      confidence: "medium",
      detail: predictions.laborCost.explanation
    }
  ];

  return { predictions, predictionsArray };
};

// Get predictions (Admin only)
export const getPredictions = async (req, res) => {
  try {
    const companyId = req.user.company || req.user.companyId;
    const userRole = req.user.role;

    // Check if user is Admin
    if (userRole !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: "Access denied. Predictions are available only for Admins."
      });
    }

    const { predictions, predictionsArray } = await computePredictions(companyId);

    return res.json({
      success: true,
      predictions: predictionsArray,
      predictionsRaw: predictions,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error("Predictions error:", error);
    return res.status(500).json({
      success: false,
      error: "שגיאה ביצירת תחזיות",
      details: error.message
    });
  }
};

// Get insights (Admin only)
export const getInsights = async (req, res) => {
  try {
    const companyId = req.user.company || req.user.companyId;
    const userRole = req.user.role;

    // Check if user is Admin
    if (userRole !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: "Access denied. Insights are available only for Admins."
      });
    }

    const [employees, finance, projects, tasks, shifts, budgets] = await Promise.all([
      Employees.find({ companyId: companyId }).populate('department'),
      Finance.find({ companyId: companyId }),
      Projects.find({ companyId: companyId }),
      Tasks.find({ companyId: companyId }),
      Shifts.find({ companyId: companyId }),
      Budget.find({ companyId: companyId }),
    ]);

    const insights = [];

    // Employee utilization insight
    const tasksPerEmployee = tasks.length / (employees.length || 1);
    if (tasksPerEmployee > 10) {
      insights.push({
        type: 'warning',
        category: 'workforce',
        title: 'עומס עבודה גבוה',
        description: `ממוצע של ${tasksPerEmployee.toFixed(1)} משימות לעובד. שקול להגדיל את הצוות או לתעדף משימות.`,
        impact: 'high'
      });
    }

    // Budget utilization insight
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const usedBudget = budgets.reduce((sum, b) => sum + (b.usedAmount || 0), 0);
    const budgetUtilization = (usedBudget / totalBudget) * 100;
    
    if (budgetUtilization > 90) {
      insights.push({
        type: 'warning',
        category: 'finance',
        title: 'תקציב כמעט מוצה',
        description: `${budgetUtilization.toFixed(1)}% מהתקציב נוצל. שקול להקצות תקציב נוסף או להקפיא הוצאות.`,
        impact: 'high'
      });
    } else if (budgetUtilization < 50) {
      insights.push({
        type: 'opportunity',
        category: 'finance',
        title: 'תקציב זמין',
        description: `רק ${budgetUtilization.toFixed(1)}% מהתקציב נוצל. ניתן להשקיע במיזמים חדשים.`,
        impact: 'medium'
      });
    }

    // Project timeline insight
    const delayedProjects = projects.filter(p => {
      if (!p.endDate || p.status === 'completed') return false;
      return new Date(p.endDate) < new Date() && p.status === 'active';
    });
    
    if (delayedProjects.length > 0) {
      insights.push({
        type: 'alert',
        category: 'projects',
        title: 'פרויקטים באיחור',
        description: `${delayedProjects.length} פרויקטים חורגים מלוח הזמנים. דרוש טיפול מיידי.`,
        projects: delayedProjects.map(p => p.name),
        impact: 'critical'
      });
    }

    // Labor cost efficiency
    const avgShiftCost = shifts.reduce((sum, s) => sum + s.totalCost, 0) / (shifts.length || 1);
    const avgShiftHours = shifts.reduce((sum, s) => sum + s.totalHours, 0) / (shifts.length || 1);
    const costPerHour = avgShiftCost / (avgShiftHours || 1);
    
    insights.push({
      type: 'info',
      category: 'efficiency',
      title: 'עלות עבודה',
      description: `עלות ממוצעת: $${costPerHour.toFixed(2)} לשעה. ${costPerHour > 50 ? 'גבוהה יחסית' : 'תוך גבולות סבירים'}.`,
      impact: costPerHour > 50 ? 'medium' : 'low'
    });

    // Task completion rate
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const completionRate = (completedTasks / tasks.length) * 100;
    
    if (completionRate < 60) {
      insights.push({
        type: 'warning',
        category: 'productivity',
        title: 'שיעור השלמת משימות נמוך',
        description: `רק ${completionRate.toFixed(1)}% מהמשימות הושלמו. שקול לבחון חסמים או חלוקה מחדש.`,
        impact: 'medium'
      });
    }

    return res.json({
      success: true,
      insights,
      summary: `נמצאו ${insights.length} תובנות עבור החברה`,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error("Insights error:", error);
    return res.status(500).json({
      success: false,
      error: "שגיאה ביצירת תובנות",
      details: error.message
    });
  }
};

// Get company summary
export const getCompanySummary = async (req, res) => {
  try {
    const companyId = req.user.company || req.user.companyId;

    const [
      company,
      employees,
      finance,
      projects,
      tasks,
      customers,
      inventory,
      budgets
    ] = await Promise.all([
      Companies.findById(companyId),
      Employees.find({ companyId: companyId }),
      Finance.find({ companyId: companyId }),
      Projects.find({ companyId: companyId }),
      Tasks.find({ companyId: companyId }),
      Customers.find({ companyId: companyId }),
      Inventory.find({ companyId: companyId }).populate('productId'),
      Budget.find({ companyId: companyId }),
    ]);

    const revenue = finance.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
    const expenses = finance.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
    const profit = revenue - expenses;

    const summary = {
      company: {
        name: company.name,
        industry: company.industry,
        employees: employees.length
      },
      financial: {
        revenue,
        expenses,
        profit,
        profitMargin: revenue > 0 ? ((profit / revenue) * 100).toFixed(2) + '%' : '0%'
      },
      operations: {
        projects: projects.length,
        activeProp: projects.filter(p => p.status === 'active').length,
        tasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length
      },
      sales: {
        customers: customers.length,
        activeCustomers: customers.filter(c => c.status === 'active').length
      },
      inventory: {
        items: inventory.length,
        value: inventory.reduce((sum, i) => sum + (i.quantity * (i.productId?.unitPrice || 0)), 0)
      }
    };

    return res.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error("Summary error:", error);
    return res.status(500).json({
      success: false,
      error: "שגיאה ביצירת סיכום",
      details: error.message
    });
  }
};

// Comparative analysis (Admin only)
export const getComparativeAnalysis = async (req, res) => {
  try {
    const companyId = req.user.company || req.user.companyId;
    const userRole = req.user.role;

    if (userRole !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: "Access denied. Comparative analysis is available only for Admins."
      });
    }

    const { period1, period2 } = req.query; // e.g., '2024-01', '2024-02'

    // This would compare two time periods
    // Simplified version
    const finance = await Finance.find({ companyId: companyId });
    
    const analysis = {
      message: "ניתוח השוואתי בפיתוח",
      periods: { period1, period2 },
      totalRecords: finance.length
    };

    return res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error("Comparative analysis error:", error);
    return res.status(500).json({
      success: false,
      error: "שגיאה בניתוח השוואתי",
      details: error.message
    });
  }
};

export default {
  chat,
  getPredictions,
  getInsights,
  getCompanySummary,
  getComparativeAnalysis
};
