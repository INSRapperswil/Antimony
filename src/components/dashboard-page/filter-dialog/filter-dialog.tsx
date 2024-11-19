import React, {useState, useEffect} from 'react';

import {Chip} from 'primereact/chip';
import {Button} from 'primereact/button';

import {LabState} from '@sb/types/types';

import './filter-dialog.sass';
import {OverlayPanel} from 'primereact/overlaypanel';
import classNames from 'classnames';
import {useGroupStore} from '@sb/lib/stores/root-store';

interface FilterDialogProps {
  filters: LabState[];
  setFilters: Function;
  groups: string[];
  setGroups: Function;
  PopOverVisible: React.RefObject<OverlayPanel>;
}
const FilterDialog: React.FC<FilterDialogProps> = (
  props: FilterDialogProps
) => {
  const [tempFilters, setTempFilters] = useState<LabState[]>(props.filters);
  const [tempGroups, setTempGroups] = useState<string[]>(props.groups);
  const groupStore = useGroupStore();

  useEffect(() => {
    setTempFilters(props.filters);
  }, [props.filters]);

  useEffect(() => {
    if (props.groups.length > 0) {
      setTempGroups(props.groups);
    }
  }, [props.groups]);

  const toggleTempFilter = (filter: LabState) => {
    setTempFilters(prevTempFilters => {
      if (prevTempFilters.includes(filter)) {
        return prevTempFilters.filter(f => f !== filter);
      }
      return [...prevTempFilters, filter];
    });
  };

  const toggleTempGroups = (groupId: string) => {
    setTempGroups(prevTempGroups => {
      if (prevTempGroups.includes(groupId)) {
        return prevTempGroups.filter(f => f !== groupId);
      }
      return [...prevTempGroups, groupId];
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
        <p className="filters-title">Select groups</p>
        <div className="filters-chips-container">
          {groupStore.groups.map(group => (
            <Chip
              key={group.id}
              label={group.name}
              onClick={() => toggleTempGroups(group.id)}
              className={classNames('group-chip', {
                active: tempGroups.includes(group.id),
                inactive: tempGroups.includes(group.id),
              })}
            />
          ))}
        </div>
        <div className="Apply-Filters-Container">
          <Button
            label="Apply Filters"
            onClick={() => {
              props.setFilters(tempFilters);
              props.setGroups(tempGroups);
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
