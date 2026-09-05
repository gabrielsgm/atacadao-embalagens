import { addDays, addWeeks, addMonths, setDay, nextDay, isAfter } from "date-fns";

type Frequency = "WEEKLY" | "BIWEEKLY" | "MULTIDAY" | "MONTHLY";

export function calculateNextRunDate(
  frequency: Frequency,
  weekdays: number[],
  dayOfMonth: number | null,
  fromDate: Date = new Date()
): Date {
  const now = fromDate;

  switch (frequency) {
    case "WEEKLY": {
      // weekdays[0] = dia da semana (0=Dom...6=Sáb)
      const targetDay = weekdays[0] ?? 1;
      let next = setDay(now, targetDay, { weekStartsOn: 0 });
      if (!isAfter(next, now)) next = addWeeks(next, 1);
      return next;
    }

    case "BIWEEKLY": {
      // A cada 14 dias a partir de fromDate
      return addDays(now, 14);
    }

    case "MULTIDAY": {
      // Encontra o próximo dia da semana mais próximo dentre os weekdays
      if (!weekdays.length) return addDays(now, 1);
      const candidates = weekdays.map((d) => {
        let next = setDay(now, d, { weekStartsOn: 0 });
        if (!isAfter(next, now)) next = addWeeks(next, 1);
        return next;
      });
      return candidates.sort((a, b) => a.getTime() - b.getTime())[0];
    }

    case "MONTHLY": {
      // dayOfMonth = dia do mês
      const day = dayOfMonth ?? 1;
      let next = new Date(now.getFullYear(), now.getMonth(), day);
      if (!isAfter(next, now)) {
        next = addMonths(next, 1);
      }
      return next;
    }

    default:
      return addDays(now, 7);
  }
}

// Calcula próxima data após um pedido recorrente gerado
export function advanceRecurringDate(
  frequency: Frequency,
  weekdays: number[],
  dayOfMonth: number | null,
  lastRun: Date
): Date {
  return calculateNextRunDate(frequency, weekdays, dayOfMonth, lastRun);
}
