import type { DateRange } from "@/types";
import DateRangePicker from "rsuite/cjs/DateRangePicker";
import { startOfDay, endOfDay, addDays } from "date-fns";

export default function DateRange({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (value: DateRange) => void;
}) {
  return (
    <DateRangePicker
      block
      format="dd/MM/yyyy"
      ranges={[
        {
          label: "Today",
          value: [startOfDay(new Date()), endOfDay(new Date())],
        },
        {
          label: "Tomorrow",
          value: [
            startOfDay(addDays(new Date(), 1)),
            endOfDay(addDays(new Date(), 1)),
          ],
        },
        {
          label: "Next 7 Days",
          value: [startOfDay(new Date()), endOfDay(addDays(new Date(), 6))],
        },
      ]}
      shouldDisableDate={DateRangePicker.beforeToday()}
      value={[new Date(value.start), new Date(value.end)]}
      onChange={(value) => {
        if (!value) return;
        const [start, end] = value;
        onChange({
          start: startOfDay(start).getTime(),
          end: endOfDay(end).getTime(),
        });
      }}
    />
  );
}
