import { RRule, RRuleSet, rrulestr } from "rrule";

export function expandRecurringEvents(events: any[], viewStart: Date, viewEnd: Date): any[] {
  const expanded: any[] = [];
  
  for (const event of events) {
    if (!event.recurrenceRule || event.recurrenceRule === "none") {
      expanded.push(event);
      continue;
    }
    
    try {
      let rule: RRule;
      switch (event.recurrenceRule) {
        case "daily":
          rule = new RRule({ freq: RRule.DAILY, dtstart: new Date(event.startsAt), until: event.endsAt || viewEnd });
          break;
        case "weekly":
          rule = new RRule({ freq: RRule.WEEKLY, dtstart: new Date(event.startsAt), until: event.endsAt || viewEnd });
          break;
        case "monthly":
          rule = new RRule({ freq: RRule.MONTHLY, dtstart: new Date(event.startsAt), until: event.endsAt || viewEnd });
          break;
        default:
          expanded.push(event);
          continue;
      }
      
      const occurrences = rule.between(viewStart, viewEnd, true);
      for (const occDate of occurrences) {
        const duration = new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime();
        expanded.push({
          ...event,
          id: `${event.id}_${occDate.getTime()}`,
          startsAt: occDate,
          endsAt: new Date(occDate.getTime() + duration),
          isRecurrence: true,
          originalId: event.id,
        });
      }
    } catch {
      expanded.push(event);
    }
  }
  
  return expanded;
}
