import React, {useState, useEffect} from 'react';
import {Button} from 'primereact/button';
import {LabState} from '@sb/types/Types';
import {Chip} from 'primereact/chip';

interface FilterDialogProps {
  filters: LabState[];
  setFilters: React.Dispatch<React.SetStateAction<LabState[]>>;
}

const FilterDialog: React.FC<FilterDialogProps> = (
  props: FilterDialogProps
) => {
  // Create a local state to hold the temporary filters
  const [tempFilters, setTempFilters] = useState<LabState[]>(props.filters);

  // Ensure local state is in sync when props.filters change
  useEffect(() => {
    setTempFilters(props.filters);
  }, [props.filters]);

  // Function to toggle filter in local state
  const toggleTempFilter = (filter: LabState) => {
    setTempFilters(prevTempFilters => {
      if (prevTempFilters.includes(filter)) {
        // Remove filter if already active
        return prevTempFilters.filter(f => f !== filter);
      }
      // Add filter if not active
      return [...prevTempFilters, filter];
    });
  };

  return (
    <div style={{padding: '1em'}}>
      <h3 style={{color: '#C3E4E9'}}>Select Filters</h3>
      <div style={{marginBottom: '1em', display: 'flex', flexWrap: 'wrap'}}>
        {Object.values(LabState)
          .filter(value => typeof value === 'number') // Filter enum values to only numbers
          .map(option => (
            <Chip
              key={option}
              label={LabState[option]}
              onClick={() => toggleTempFilter(option as LabState)}
              style={{
                margin: '0.5em',
                padding: '0.5em 1em',
                cursor: 'pointer',
                borderRadius: '16px',
                fontWeight: 'bold',
                backgroundColor: tempFilters.includes(option as LabState)
                  ? '#4DB6AC'
                  : '#1B2B34',
              }}
            />
          ))}
      </div>
      <Button
        label="Apply Filters"
        onClick={() => {
          props.setFilters(tempFilters);
          console.log('Filters applied:', tempFilters);
        }}
        style={{backgroundColor: '#4DB6AC', border: 'none', color: '#FFFFFF'}}
      />
    </div>
  );
};

export default FilterDialog;
