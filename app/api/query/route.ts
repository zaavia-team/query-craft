import { NextResponse } from "next/server";
import { createServerClient } from "../../lib/supabase-server";

interface Rule {
  field: string;
  operator: string;
  value: any;
}

interface RuleGroup {
  combinator: "and" | "or";
  rules: (Rule | RuleGroup)[];
}

interface JoinConfig {
  type: "INNER" |"LEFT" | "RIGHT";
  targetTable: string;
  sourceColumn: string;
  targetColumn: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { table, query, joins = [] } = body;
    console.log(query, "=>query");

    if (!table) {
      return NextResponse.json(
        { error: "Table name is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const sqlQuery = buildSQL(table, query, joins);

    try {
      const { data, error } = await supabase.rpc("execute_dynamic_query", {
        query_text: sqlQuery,
      });

      if (error) {
        console.log("SQL ERROR →", error.message);

        return NextResponse.json(
          {
            success: false,
            userMessage:
              "You have written the wrong query. Please check the syntax.",
            devMessage: error.message, // internal debugging
          },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, table, count: data?.length || 0, data, hasJoins: joins.length > 0 });
    } catch (err: any) {
      console.error("FATAL ERROR →", err);

      return NextResponse.json(
        {
          success: false,
          userMessage:
            "There was an issue understanding the query present in the system.",
          devMessage: err.message,
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

function buildSQL(table: string, query: RuleGroup, joins: JoinConfig[]): string {
  let sql = `SELECT ${table}.*`;

  // Add all join table columns with alias to avoid conflicts
  joins.forEach((j, index) => {
    const alias = `j${index}`; // j0, j1...
    sql += `, ${j.targetTable}.*`; // optionally: `${j.targetTable} AS ${alias}`
  });

  sql += ` FROM ${table}`;

  // Proper JOIN statements
  joins.forEach((j) => {
    if (!j.sourceColumn || !j.targetColumn) {
      throw new Error(`JOIN columns missing for table ${j.targetTable}`);
    }
    const joinType = j.type === "INNER" ? "" : `${j.type} JOIN`;
    sql += ` ${joinType} JOIN ${j.targetTable} ON ${table}.${j.sourceColumn} = ${j.targetTable}.${j.targetColumn}`;
  });

  // Build WHERE clause
  if (query && query.rules.length > 0) {
    const whereClause = buildWhere(query, table);
    if (whereClause.trim() !== "") {
      sql += ` WHERE ${whereClause}`;
    }
  }

  return sql;
}

function buildWhere(group: RuleGroup, table: string): string {
  const parts: string[] = [];

  for (const rule of group.rules) {
    if ("rules" in rule) {
      const nested = buildWhere(rule, table);
      if (nested.trim() !== "") parts.push(`(${nested})`);
      continue;
    }

    if (rule.field && rule.operator) {
      parts.push(buildCondition(rule, table));
    }
  }

  return parts.join(` ${group.combinator.toUpperCase()} `);
}

function buildCondition(rule: Rule, defaultTable: string): string {
  // If field has dot notation, use as is. Else use default table
  let field = rule.field.includes(".") ? rule.field : `${defaultTable}.${rule.field}`;

  // Escape string values
  const escape = (val: any) =>
    typeof val === "string" ? `'${val.replace(/'/g, "''")}'` : String(val);

  switch (rule.operator) {
    case "=": return `${field} = ${escape(rule.value)}`;
    case "!=": return `${field} != ${escape(rule.value)}`;
    case "<": return `${field} < ${escape(rule.value)}`;
    case ">": return `${field} > ${escape(rule.value)}`;
    case "<=": return `${field} <= ${escape(rule.value)}`;
    case ">=": return `${field} >= ${escape(rule.value)}`;
    case "contains": return `${field} ILIKE '%${rule.value}%'`;
    case "beginsWith": return `${field} ILIKE '${rule.value}%'`;
    case "endsWith": return `${field} ILIKE '%${rule.value}'`;
    case "null": return `${field} IS NULL`;
    case "notNull": return `${field} IS NOT NULL`;
    case "in":
      const arr = Array.isArray(rule.value)
        ? rule.value.map(v => escape(v)).join(", ")
        : escape(rule.value);
      return `${field} IN (${arr})`;
    default: return `${field} = ${escape(rule.value)}`;
  }
}