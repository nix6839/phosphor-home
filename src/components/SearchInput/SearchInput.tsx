import React, { useState, useEffect, useRef, MutableRefObject } from "react";
import { useRecoilState } from "recoil";
import { useDebounce } from "react-use";
import { useHotkeys } from "react-hotkeys-hook";
import { Command, MagnifyingGlass, X, HourglassHigh } from "phosphor-react";
import ReactGA from "react-ga";

import { searchQueryAtom } from "../../state/atoms";
import "./SearchInput.css";

const apple = /iPhone|iPod|iPad|Macintosh|MacIntel|MacPPC/i;
const isApple = apple.test(window.navigator.platform);

const mobile = /Android|iPhone|iPod|iPad|Opera Mini|IEMobile/i;
const isMobile = mobile.test(window.navigator.userAgent);

type SearchInputProps = {};

const SearchInput: React.FC<SearchInputProps> = () => {
  const [value, setValue] = useState<string>("");
  const [query, setQuery] = useRecoilState(searchQueryAtom);
  const inputRef =
    useRef<HTMLInputElement>() as MutableRefObject<HTMLInputElement>;

  useHotkeys("ctrl+k,cmd+k", (e) => {
    e.preventDefault();
    if (!e.repeat) {
      inputRef.current?.focus();
      inputRef.current.select();
    }
  });

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    let isMounted = true;
    if (value !== query) {
      isMounted && setValue(query);
      ReactGA.event({ category: "Search", action: "Tag", label: query });
    }
    return () => void (isMounted = false);
  }, [query]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const [isReady] = useDebounce(
    () => {
      if (value !== query) {
        setQuery(value);
        !!value &&
          ReactGA.event({ category: "Search", action: "Query", label: value });
      }
      !!value &&
        void document
          .getElementById("beacon")
          ?.scrollIntoView({ block: "start", behavior: "smooth" });
    },
    500,
    [value]
  );

  const handleCancelSearch = () => {
    setValue("");
    // Should cancel pending debounce timeouts and immediately clear query
    // without causing lag!
    // setQuery("");
  };

  return (
    <div className="search-bar">
      <MagnifyingGlass id="search-icon" size={24} />
      <input
        ref={inputRef}
        id="search-input"
        title="Search for icon names, categories, or keywords"
        aria-label="Search for an icon"
        type="text"
        autoCapitalize="off"
        autoComplete="off"
        value={value}
        placeholder="Search"
        onChange={({ currentTarget }) => setValue(currentTarget.value)}
        onKeyPress={({ currentTarget, key }) =>
          key === "Enter" && currentTarget.blur()
        }
      />
      {!value && !isMobile && <Keys>{isApple ? <Command /> : "Ctrl + "}K</Keys>}
      {value ? (
        isReady() ? (
          <X className="clear-icon" size={18} onClick={handleCancelSearch} />
        ) : (
          <HourglassHigh className="wait-icon" weight="fill" size={18} />
        )
      ) : null}
    </div>
  );
};

const Keys: React.FC<{}> = ({ children }) => (
  <div className="keys">{children}</div>
);

export default SearchInput;
