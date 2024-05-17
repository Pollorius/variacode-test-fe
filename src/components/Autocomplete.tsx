import React, { useState, useEffect, useRef } from 'react';
import { WATCHMODE_API_KEY } from '../config';
import styles from './Autocomplete.module.css';

interface Suggestion {
  id: string;
  name: string;
}

const Autocomplete: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(false);
  const debounceTimeout = useRef<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (query.length > 0) {
        setLoading(true);
        try {
          const response = await fetch(
            `https://api.watchmode.com/v1/autocomplete-search/?apiKey=${WATCHMODE_API_KEY}&search_value=${query}&search_type=1`
          );
          const result = await response.json();
          if (result && result.results) {
            const filteredSuggestions = result.results.map((item: any) => ({
              id: item.id,
              name: item.name,
            }));
            setSuggestions(filteredSuggestions);
          } else {
            setSuggestions([]);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          setSuggestions([]);
        }
        setLoading(false);
      } else {
        setSuggestions([]);
        setLoading(false);
      }
    };

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = window.setTimeout(() => {
      fetchData();
    }, 300);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      setHighlightedIndex((prevIndex) => Math.min(prevIndex + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      setHighlightedIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      setQuery(suggestions[highlightedIndex].name);
      setSuggestions([]);
    }
  };

  return (
    <div className={styles.autocomplete}>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={styles.input}
          placeholder="Search for movies and shows..."
        />
        {loading && <div className={styles.spinner}></div>}
      </div>
      {suggestions.length > 0 && (
        <ul className={styles.suggestions}>
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              className={`${styles.suggestion} ${index === highlightedIndex ? styles.highlighted : ''}`}
              onMouseDown={() => setQuery(suggestion.name)}
            >
              {highlightMatchingText(suggestion.name, query)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const highlightMatchingText = (text: string, query: string) => {
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, index) => (
    <span
      key={index}
      style={part.toLowerCase() === query.toLowerCase() ? { fontWeight: 'bold' } : {}}
    >
      {part}
    </span>
  ));
};

export default Autocomplete;