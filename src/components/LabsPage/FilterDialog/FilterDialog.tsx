import React, {useState, useEffect} from 'react';

import {Chip} from 'primereact/chip';
import {Button} from 'primereact/button';

import {LabState} from '@sb/types/Types';

import './FilterDialog.sass';

interface FilterDialogProps {
  filters: LabState[];
  setFilters: React.Dispatch<React.SetStateAction<LabState[]>>;
}

const FilterDialog: React.FC<FilterDialogProps> = (
  props: FilterDialogProps
) => {
  const [tempFilters, setTempFilters] = useState<LabState[]>(props.filters);

  useEffect(() => {
    setTempFilters(props.filters);
  }, [props.filters]);

  const toggleTempFilter = (filter: LabState) => {
    setTempFilters(prevTempFilters => {
      if (prevTempFilters.includes(filter)) {
        return prevTempFilters.filter(f => f !== filter);
      }
      return [...prevTempFilters, filter];
    });
  };

  return (
    <div className="filters-container">
      <p className="filters-title">Select Filters</p>
      <div className="filters-chips-container">
        {Object.values(LabState)
          .filter(value => typeof value === 'number')
          .map(option => (
            <Chip
              key={option}
              label={LabState[option]}
              onClick={() => toggleTempFilter(option as LabState)}
              className={`filter-chip ${tempFilters.includes(option as LabState) ? 'active' : 'inactive'}`}
            />
          ))}
      </div>
      <Button
        label="Apply Filters"
        onClick={() => {
          props.setFilters(tempFilters);
          console.log('Filters applied:', tempFilters);
        }}
        className="filters-apply-button"
      />
    </div>
  );
};

export default FilterDialog;
