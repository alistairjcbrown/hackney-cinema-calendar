import type { Venue } from "@/types";
import { Checkbox, CheckPicker } from "rsuite";

export default function VenueFilter({
  venues,
  values,
  onChange,
}: {
  venues: Record<string, Venue>;
  values: Record<string, boolean>;
  onChange: (values: Record<string, boolean>) => void;
}) {
  const data = Object.values(venues)
    .map(({ id, name }) => ({ value: id, label: name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div>
      <CheckPicker
        block
        searchable
        size="lg"
        placeholder="Venues"
        data={data}
        value={Object.keys(values)}
        onChange={(displayed: string[]) => {
          const filteredVenues = displayed.reduce(
            (filtered, value) => ({ ...filtered, [value]: true }),
            {} as Record<string, boolean>,
          );
          onChange(filteredVenues);
        }}
        renderExtraFooter={() => (
          <div style={{ borderTop: "1px solid #e5e5e5" }}>
            <Checkbox
              indeterminate={
                Object.keys(values).length > 0 &&
                Object.keys(values).length < Object.keys(venues).length
              }
              checked={
                Object.keys(values).length === Object.keys(venues).length
              }
              onChange={(value, checked) => {
                if (checked) {
                  onChange(
                    Object.keys(venues).reduce(
                      (mapping, id) => ({ ...mapping, [id]: true }),
                      {},
                    ),
                  );
                } else {
                  onChange({});
                }
              }}
            >
              Check all
            </Checkbox>
          </div>
        )}
      />
    </div>
  );
}
