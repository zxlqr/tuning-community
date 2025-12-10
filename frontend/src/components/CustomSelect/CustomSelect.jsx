import { useState, useRef, useEffect } from 'react'
import './CustomSelect.css'

/**
 * Кастомный выпадающий список в стиле приложения
 * @param {Array} options - Массив опций [{value: string, label: string}]
 * @param {string} value - Текущее выбранное значение
 * @param {function} onChange - Функция изменения значения
 * @param {string} className - Дополнительные классы
 */
const CustomSelect = ({ options = [], value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const selectRef = useRef(null)
  const dropdownRef = useRef(null)

  const selectedOption = options.find(opt => opt.value === value) || options[0]

  // Закрываем при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  // Обработка клавиатуры
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault()
          setIsOpen(true)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex(prev =>
            prev < options.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : options.length - 1
          )
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (highlightedIndex >= 0) {
            handleSelect(options[highlightedIndex].value)
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          setHighlightedIndex(-1)
          break
        default:
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, highlightedIndex, options])

  const handleSelect = (newValue) => {
    onChange(newValue)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      const currentIndex = options.findIndex(opt => opt.value === value)
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0)
    }
  }

  return (
    <div className={`custom-select ${className}`}>
      <div
        ref={selectRef}
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleToggle()
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="custom-select-value">{selectedOption?.label || 'Выберите...'}</span>
        <svg
          className={`custom-select-arrow ${isOpen ? 'open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 9L1 4h10z"
            fill="#e7dfcc"
          />
        </svg>
      </div>
      {isOpen && (
        <div
          ref={dropdownRef}
          className="custom-select-dropdown"
          role="listbox"
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              className={`custom-select-option ${
                option.value === value ? 'selected' : ''
              } ${
                index === highlightedIndex ? 'highlighted' : ''
              }`}
              onClick={() => handleSelect(option.value)}
              onMouseEnter={() => setHighlightedIndex(index)}
              role="option"
              aria-selected={option.value === value}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomSelect

