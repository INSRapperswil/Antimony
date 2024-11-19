import React, {useState, useEffect} from 'react';

import {Chip} from 'primereact/chip';
import {Button} from 'primereact/button';

import {LabState} from '@sb/types/types';

import './filter-dialog.sass';
import {OverlayPanel} from 'primereact/overlaypanel';
import classNames from 'classnames';

interface FilterDialogProps {
  filters: LabState[];
  setFilters: Function;
  PopOverVisible: React.RefObject<OverlayPanel>;
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
    <OverlayPanel ref={props.PopOverVisible} id="filter-overlay-panel">
      <div className="filters-container">
        <p className="filters-title">Select Filters</p>
        <div className="filters-chips-container">
          {Object.values(LabState)
            .filter(value => typeof value === 'number') // Ensure only valid LabState values are used
            .map(option => (
              <Chip
                key={option}
                label={LabState[option]}
                onClick={() => toggleTempFilter(option as LabState)}
                className={classNames('filter-chip', {
                  active: tempFilters.includes(option as LabState),
                  inactive: !tempFilters.includes(option as LabState),
                  running: option === LabState.Running,
                  scheduled: option === LabState.Scheduled,
                  deploying: option === LabState.Deploying,
                  done: option === LabState.Done,
                  failed: option === LabState.Failed,
                })}
              />
            ))}
        </div>
        <div className="Apply-Filters-Container">
          <Button
            label="Apply Filters"
            onClick={() => {
              props.setFilters(tempFilters);
              props.PopOverVisible.current?.hide();
            }}
            className="filters-apply-button"
          />
        </div>
      </div>
    </OverlayPanel>
  );
};

export default FilterDialog;
