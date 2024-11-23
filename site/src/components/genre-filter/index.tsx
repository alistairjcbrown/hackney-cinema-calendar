import type { Genre } from "@/types";
import { Checkbox, CheckPicker } from "rsuite";

export default function GenreFilter({
  genres,
  values,
  onChange,
}: {
  genres: Record<string, Genre>;
  values: Record<string, boolean>;
  onChange: (values: Record<string, boolean>) => void;
}) {
  const data = Object.values(genres)
    .map(({ id, name }) => ({ value: id, label: name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div>
      <CheckPicker
        block
        searchable
        size="lg"
        placeholder="Genres"
        data={data}
        value={Object.keys(values)}
        onChange={(displayed: string[]) => {
          const filteredGenres = displayed.reduce(
            (filtered, value) => ({ ...filtered, [value]: true }),
            {} as Record<string, boolean>,
          );
          onChange(filteredGenres);
        }}
        renderExtraFooter={() => (
          <div style={{ borderTop: "1px solid #e5e5e5" }}>
            <Checkbox
              indeterminate={
                Object.keys(values).length > 0 &&
                Object.keys(values).length < Object.keys(genres).length
              }
              checked={
                Object.keys(values).length === Object.keys(genres).length
              }
              onChange={(value, checked) => {
                if (checked) {
                  onChange(
                    Object.keys(genres).reduce(
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
