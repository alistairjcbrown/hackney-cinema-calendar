import { classificationOrder, type Classification } from "@/types";
import Checkbox from "rsuite/cjs/Checkbox";
import CheckPicker from "rsuite/cjs/CheckPicker";

function sortArrayByOrder(
  unorderedArray: Classification[],
  orderedArray: Classification[],
) {
  // Create a map to store the index of each letter in the first array
  const indexMap = new Map();
  orderedArray.forEach((value, index) => indexMap.set(value, index));

  // Sort the second array based on the order in the first array
  return unorderedArray.sort((a, b) => {
    // Check if both letters are in the first array
    if (indexMap.has(a) && indexMap.has(b)) {
      // Sort based on the index in the first array
      return indexMap.get(a) - indexMap.get(b);
    } else if (indexMap.has(a)) {
      // 'a' is in the first array, so it comes before 'b'
      return -1;
    } else if (indexMap.has(b)) {
      // 'b' is in the first array, so it comes before 'a'
      return 1;
    } else {
      // Neither 'a' nor 'b' are in the first array, so sort alphabetically
      return a.localeCompare(b);
    }
  });
}

export default function ClassificationFilter({
  classifications,
  values,
  onChange,
}: {
  classifications: Classification[];
  values: Record<Classification, boolean>;
  onChange: (values: Record<string, boolean>) => void;
}) {
  const data = sortArrayByOrder(classifications, classificationOrder).map(
    (value) => ({ value, label: value }),
  );

  return (
    <div>
      <CheckPicker
        block
        searchable
        size="lg"
        placeholder="Movie Classification"
        data={data}
        value={Object.keys(values)}
        onChange={(displayed: string[]) => {
          const filteredClassifications = displayed.reduce(
            (filtered, value) => ({ ...filtered, [value]: true }),
            {} as Record<string, boolean>,
          );
          onChange(filteredClassifications);
        }}
        onClean={() => {
          const filteredClassifications = classifications.reduce(
            (filtered, value) => ({ ...filtered, [value]: true }),
            {} as Record<string, boolean>,
          );
          // Horrible hack to let us control the change call for "clearing" the
          // input. In this case, we want to reset it back to fully populated.
          setTimeout(() => onChange(filteredClassifications), 0);
        }}
        renderExtraFooter={() => (
          <div style={{ borderTop: "1px solid #e5e5e5" }}>
            <Checkbox
              indeterminate={
                Object.keys(values).length > 0 &&
                Object.keys(values).length < classifications.length
              }
              checked={Object.keys(values).length === classifications.length}
              onChange={(value, checked) => {
                if (checked) {
                  onChange(
                    classifications.reduce(
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
