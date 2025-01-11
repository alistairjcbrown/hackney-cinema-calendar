import AutoComplete from "rsuite/cjs/AutoComplete";
import InputGroup from "rsuite/cjs/InputGroup";
import SearchIcon from "@rsuite/icons/Search";
import CloseIcon from "@rsuite/icons/Close";
import { useCinemaData } from "@/state/cinema-data-context";

export default function Search({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { data } = useCinemaData();
  const autocompleteData = [
    ...new Set(Object.values(data!.movies).map(({ title }) => title)),
  ];
  return (
    <InputGroup inside>
      <InputGroup.Addon>
        <SearchIcon />
      </InputGroup.Addon>
      <AutoComplete
        placeholder="Search"
        data={autocompleteData}
        value={value}
        onChange={(value) => onChange(value)}
      />
      <InputGroup.Button onClick={() => onChange("")}>
        <CloseIcon />
      </InputGroup.Button>
    </InputGroup>
  );
}
