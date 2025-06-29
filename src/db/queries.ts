import { getDatabase } from './connection';
import { llmRequests } from './schema';
import { sql, desc, and, gte, lte, eq } from 'drizzle-orm';

export async function getUsageStats() {
  const db = await getDatabase();
  
  const result = await db
    .select({
      totalRequests: sql<number>`count(*)`,
      totalTokens: sql<number>`sum(${llmRequests.totalTokens})`,
      totalCost: sql<number>`sum(${llmRequests.estimatedCost})`,
    })
    .from(llmRequests)
    .where(eq(llmRequests.status, 'success'));

  const stats = result[0];
  
  return {
    totalRequests: Number(stats?.totalRequests ?? 0),
    totalTokens: Number(stats?.totalTokens ?? 0),
    totalCost: Number(stats?.totalCost ?? 0),
  };
}

export async function getProviderStats() {
  const db = await getDatabase();
  
  const results = await db
    .select({
      provider: llmRequests.provider,
      totalRequests: sql<number>`count(*)`,
      totalTokens: sql<number>`sum(${llmRequests.totalTokens})`,
      totalCost: sql<number>`sum(${llmRequests.estimatedCost})`,
    })
    .from(llmRequests)
    .where(eq(llmRequests.status, 'success'))
    .groupBy(llmRequests.provider);

  return results.map(r => ({
    provider: r.provider,
    totalRequests: Number(r.totalRequests),
    totalTokens: Number(r.totalTokens),
    totalCost: Number(r.totalCost),
  }));
}

export async function getUsageByDateRange(days: number) {
  const db = await getDatabase();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const results = await db
    .select({
      date: sql<string>`date(${llmRequests.timestamp})`,
      requests: sql<number>`count(*)`,
      tokens: sql<number>`sum(${llmRequests.totalTokens})`,
      cost: sql<number>`sum(${llmRequests.estimatedCost})`,
    })
    .from(llmRequests)
    .where(
      and(
        gte(llmRequests.timestamp, startDate),
        eq(llmRequests.status, 'success')
      )
    )
    .groupBy(sql`date(${llmRequests.timestamp})`)
    .orderBy(sql`date(${llmRequests.timestamp})`);

  return results.map(r => ({
    date: r.date,
    requests: Number(r.requests),
    tokens: Number(r.tokens),
    cost: Number(r.cost),
  }));
}

export async function getDetailedUsage(options: {
  startDate?: string;
  endDate?: string;
  provider?: string;
  limit: number;
  offset: number;
}) {
  const db = await getDatabase();
  
  const conditions = [eq(llmRequests.status, 'success')];
  
  if (options.startDate) {
    conditions.push(gte(llmRequests.timestamp, new Date(options.startDate)));
  }
  
  if (options.endDate) {
    conditions.push(lte(llmRequests.timestamp, new Date(options.endDate)));
  }
  
  if (options.provider) {
    conditions.push(eq(llmRequests.provider, options.provider as 'openai' | 'gemini' | 'azure'));
  }
  
  const [results, countResult] = await Promise.all([
    db
      .select()
      .from(llmRequests)
      .where(and(...conditions))
      .orderBy(desc(llmRequests.timestamp))
      .limit(options.limit)
      .offset(options.offset),
    
    db
      .select({ count: sql<number>`count(*)` })
      .from(llmRequests)
      .where(and(...conditions)),
  ]);
  
  return {
    data: results,
    total: Number(countResult[0]?.count ?? 0),
  };
}