import {observer} from 'mobx-react-lite';
import React from 'react';

import {Chip} from 'primereact/chip';

import {LabState} from '@sb/types/types';

import './filter-dialog.sass';
import {OverlayPanel} from 'primereact/overlaypanel';
import classNames from 'classnames';
import {useGroupStore, useLabStore} from '@sb/lib/stores/root-store';

interface FilterDialogProps {
  // filters: LabState[];
  // setFilters: Function;
  // groups: string[];
  // setGroups: Function;
  popOverRef: React.RefObject<OverlayPanel>;
}
const FilterDialog: React.FC<FilterDialogProps> = observer(
  (props: FilterDialogProps) => {
    // const [tempFilters, setTempFilters] = useState<LabState[]>(props.filters);
    // const [tempGroups, setTempGroups] = useState<string[]>(props.groups);
    const labStore = useLabStore();
    const groupStore = useGroupStore();

    // useEffect(() => {
    //   setTempFilters(props.filters);
    // }, [props.filters]);
    //
    // useEffect(() => {
    //   if (props.groups.length > 0) {
    //     setTempGroups(props.groups);
    //   }
    // }, [props.groups]);

    const toggleStateFilter = (state: LabState) => {
      if (labStore.stateFilter.includes(state)) {
        labStore.setStateFilter(labStore.stateFilter.filter(s => s !== state));
      } else {
        labStore.setStateFilter([...labStore.stateFilter, state]);
      }
    };

    const toggleGroupFilter = (group: string) => {
      if (labStore.groupFilter.includes(group)) {
        labStore.setGroupFilter(labStore.groupFilter.filter(g => g !== group));
      } else {
        labStore.setGroupFilter([...labStore.groupFilter, group]);
      }
    };

    return (
      <OverlayPanel ref={props.popOverRef} id="filter-overlay-panel">
        <div className="filters-container">
          <p className="filters-title">Select Filters</p>
          <div className="filters-chips-container">
            {Object.values(LabState)
              .filter(value => typeof value === 'number') // Ensure only valid LabState values are used
              .map(option => (
                <Chip
                  key={option}
                  label={LabState[option]}
                  onClick={() => toggleStateFilter(option as LabState)}
                  className={classNames('filter-chip', {
                    active: labStore.stateFilter.includes(option as LabState),
                    inactive: !labStore.stateFilter.includes(
                      option as LabState
                    ),
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
            {groupStore.data.map(group => (
              <Chip
                key={group.id}
                label={group.name}
                onClick={() => toggleGroupFilter(group.id)}
                className={classNames('group-chip', {
                  active: labStore.groupFilter.includes(group.id),
                  inactive: !labStore.groupFilter.includes(group.id),
                })}
              />
            ))}
          </div>
          {/*<div className="Apply-Filters-Container">*/}
          {/*  <Button*/}
          {/*    label="Apply Filters"*/}
          {/*    onClick={() => {*/}
          {/*      props.setFilters(tempFilters);*/}
          {/*      props.setGroups(tempGroups);*/}
          {/*      props.PopOverVisible.current?.hide();*/}
          {/*    }}*/}
          {/*    className="filters-apply-button"*/}
          {/*  />*/}
          {/*</div>*/}
        </div>
      </OverlayPanel>
    );
  }
);

export default FilterDialog;
