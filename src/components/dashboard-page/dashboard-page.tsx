import React, {
  MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {Chip} from 'primereact/chip';
import {InputText} from 'primereact/inputtext';
import {IconField} from 'primereact/iconfield';
import {InputIcon} from 'primereact/inputicon';

import {Group, Lab, LabState} from '@sb/types/types';
import {
  useGroupStore,
  useLabStore,
  useNotifications,
} from '@sb/lib/stores/root-store';
import LabDialog from '@sb/components/dashboard-page/lab-dialog/lab-dialog';
import FilterDialog from '@sb/components/dashboard-page/filter-dialog/filter-dialog';
import ReservationDialog from '@sb/components/dashboard-page/reservation-dialog/reservation-dialog';
import {Choose, If, Otherwise, When} from '@sb/types/control';

import './dashboard-page.sass';
import classNames from 'classnames';
import {Paginator} from 'primereact/paginator';
import {Button} from 'primereact/button';
import {OverlayPanel} from 'primereact/overlaypanel';
import {useSearchParams} from 'react-router-dom';
import {autorun} from 'mobx';

const statusIcons: Record<LabState, string> = {
  [LabState.Scheduled]: 'pi pi-calendar',
  [LabState.Deploying]: 'pi pi-sync pi-spin',
  [LabState.Running]: 'pi pi-check',
  [LabState.Failed]: 'pi pi-times',
  [LabState.Done]: 'pi pi-check',
};

const DashboardPage: React.FC = () => {
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<LabState[]>([
    LabState.Deploying,
    LabState.Running,
  ]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalAmountOfEntries, setTotalAmountOfEntries] = useState<number>(10); // use API header in future
  const [pageSize, setPageSize] = useState<number>(5);
  const groupStore = useGroupStore();
  const notificationStore = useNotifications();
  const labStore = useLabStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reschedulingDialogLab, setReschedulingDialogLab] =
    useState<Lab | null>(null);
  const popOver = useRef<OverlayPanel>(null);
  const [, setSearchParams] = useSearchParams();
  const typingTimeoutRef = useRef<number | undefined>(undefined);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const {height} = containerRef.current.getBoundingClientRect();
        const adjustedHeight = height - 68; // Adjust for padding/margins
        setContentHeight(adjustedHeight);
        setPageSize(Math.floor(adjustedHeight / 80)); // Calculate page size directly
      }
    };

    // Add event listeners for both resize and fullscreen change
    window.addEventListener('resize', updateHeight);
    document.addEventListener('fullscreenchange', updateHeight); // Listen for fullscreen changes

    updateHeight();

    return () => {
      // Cleanup listeners
      window.removeEventListener('resize', updateHeight);
      document.removeEventListener('fullscreenchange', updateHeight);
    };
  }, [containerRef]);

  useEffect(() => {
    labStore.setParameters(
      pageSize,
      pageSize * currentPage,
      searchQuery,
      selectedFilters,
      selectedGroups
    );
  }, [pageSize, currentPage, searchQuery, selectedFilters, selectedGroups]);

  useEffect(() => {
    if (labStore.header) {
      setTotalAmountOfEntries(Number(labStore.header));
    }
    const dispose = autorun(() => {
      setLabs(labStore.labs);
    });
    return () => dispose();
  }, []);

  useEffect(() => {
    const dispose = autorun(() => {
      setGroups(groupStore.groups);
    });
    return () => dispose();
  }, [groupStore.groups]);

  useEffect(() => {
    const ids: string[] = groups.map(group => group.id);
    setSelectedGroups(ids);
  }, [groups]);

  const handleSearchChange = (value: string) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      setSearchQuery(value);
    }, 100);
  };
  function getGroupById(groupId: String): String {
    const group = groupStore.groups.find(group => group.id === groupId);
    if (group !== undefined) {
      return group.name;
    }
    return 'No group found';
  }
  function handleLabDate(lab: Lab): string {
    let timeString: Date;

    switch (lab.state) {
      case LabState.Scheduled:
        timeString = new Date(lab.startDate);
        return timeString.toISOString().split('T')[0];

      case LabState.Deploying:
      case LabState.Running:
        timeString = new Date(lab.startDate);
        return timeString.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

      case LabState.Done:
      case LabState.Failed:
        timeString = new Date(lab.endDate);
        return timeString.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

      default:
        return '';
    }
  }

  function onRescheduleLab(event: MouseEvent<HTMLButtonElement>, lab: Lab) {
    event.stopPropagation();
    setReschedulingDialogLab(lab);
  }

  function onStopLab(event: MouseEvent<HTMLButtonElement>, lab: Lab) {
    event.stopPropagation();
    notificationStore.confirm({
      message: 'This action cannot be undone.',
      header: `Stop Lab '${lab.name}'?`,
      icon: 'pi pi-stop',
      severity: 'danger',
      onAccept: onStopConfirm,
    });
  }

  function onStopConfirm() {}

  function closeDialog() {
    setSelectedLab(null);
  }

  function closeReschedulingDialog() {
    setReschedulingDialogLab(null);
  }

  function setFilters(filters: LabState[]) {
    setSelectedFilters(filters);
  }

  function setGroupfilter(ids: string[]) {
    setSelectedGroups(ids);
  }

  const onLabOpen = useCallback(
    (lab: Lab) => {
      setSearchParams({t: lab.id});
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (selectedLab !== null) {
      onLabOpen(selectedLab);
    } else {
      setSearchParams('');
    }
  }, [selectedLab, onLabOpen, setSearchParams]);

  return (
    <Choose>
      <When condition={labs}>
        <div className="height-100 width-100 sb-card overflow-y-hidden overflow-x-hidden sb-labs-container">
          <div className="search-bar sb-card">
            <IconField className="search-bar-input" iconPosition="left">
              <InputIcon className="pi pi-search"></InputIcon>
              <InputText
                className="width-100"
                placeholder="Search here..."
                onChange={e => handleSearchChange(e.target.value)}
              />
            </IconField>
            <span
              className="search-bar-icon"
              onClick={e => popOver.current?.toggle(e)}
            >
              <i className="pi pi-filter" />
            </span>
            <FilterDialog
              filters={selectedFilters}
              setFilters={setFilters}
              groups={selectedGroups}
              setGroups={setGroupfilter}
              PopOverVisible={popOver}
            />
          </div>
          <div style={{display: 'flex', margin: '0 16px', gap: '5px'}}>
            {selectedFilters.map(filter => (
              <Chip
                key={filter}
                label={LabState[filter]}
                removable={true}
                onRemove={() =>
                  setSelectedFilters(prevFilters =>
                    prevFilters.filter(f => f !== filter)
                  )
                }
                className="chip"
              />
            ))}
            {selectedGroups.map(groupId => {
              const group = groups.find(g => g.id === groupId);
              if (!group) return null;
              return (
                <Chip
                  key={group.id}
                  label={group.name}
                  removable={true}
                  onRemove={() =>
                    setSelectedGroups(prevGroups =>
                      prevGroups.filter(id => id !== groupId)
                    )
                  }
                  className="chip"
                />
              );
            })}

            <If condition={searchQuery !== ''}>
              <Chip
                label={searchQuery}
                removable={true}
                onRemove={() => setSearchQuery('')}
                className="chip"
              />
            </If>
          </div>
          <div className="sb-labs-content" ref={containerRef}>
            <Choose>
              <When condition={labs!.length > 0}>
                <div className="lab-explorer-container">
                  {labs!.map(lab => (
                    <div
                      key={lab.id}
                      className="lab-item-card"
                      onClick={() => setSelectedLab(lab)}
                    >
                      {/* Group */}
                      <div
                        className="lab-group sb-corner-tab"
                        onClick={() => setSelectedLab(lab)}
                      >
                        <span>{getGroupById(lab.groupId)}</span>
                      </div>
                      {/* Lab Name */}
                      <div className="lab-name">
                        <span>{lab.name}</span>
                      </div>
                      {/* State */}
                      <div
                        className={classNames('lab-state', {
                          running: lab.state === LabState.Running,
                          scheduled: lab.state === LabState.Scheduled,
                          deploying: lab.state === LabState.Deploying,
                          done: lab.state === LabState.Done,
                          failed: lab.state === LabState.Failed,
                        })}
                      >
                        <div className="lab-state-buttons">
                          <If condition={lab.state === LabState.Scheduled}>
                            <Button
                              icon="pi pi-calendar"
                              severity="info"
                              rounded
                              text
                              size="large"
                              tooltip="Reschedule"
                              tooltipOptions={{
                                position: 'bottom',
                                showDelay: 200,
                              }}
                              onClick={e => onRescheduleLab(e, lab)}
                            />
                          </If>
                          <Button
                            icon="pi pi-stop"
                            severity="danger"
                            rounded
                            text
                            size="large"
                            tooltip="Stop"
                            tooltipOptions={{
                              position: 'bottom',
                              showDelay: 200,
                            }}
                            onClick={e => onStopLab(e, lab)}
                          />
                        </div>
                        <span className="lab-state-label">
                          <div
                            className={classNames('lab-state-label-icon', {
                              running: lab.state === LabState.Running,
                              scheduled: lab.state === LabState.Scheduled,
                              deploying: lab.state === LabState.Deploying,
                              done: lab.state === LabState.Done,
                              failed: lab.state === LabState.Failed,
                            })}
                          >
                            <i className={statusIcons[lab.state]}></i>
                            <span>{LabState[lab.state]}</span>
                          </div>
                          <div className="lab-state-date">
                            <i className="pi pi-clock"></i>
                            <span>{handleLabDate(lab)}</span>
                          </div>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <If condition={reschedulingDialogLab !== null}>
                  <ReservationDialog
                    lab={reschedulingDialogLab!}
                    closeDialog={closeReschedulingDialog}
                  />
                </If>
                {/* Dialog for Lab Details */}
                <If condition={selectedLab !== null}>
                  <LabDialog
                    lab={selectedLab!}
                    groupName={getGroupById(selectedLab!.groupId)}
                    closeDialog={closeDialog}
                  />
                </If>
              </When>
              <Otherwise>
                <span>No labs found.</span>
              </Otherwise>
            </Choose>
            <div className="pagination-controls">
              <Paginator
                first={currentPage * pageSize}
                rows={pageSize}
                totalRecords={totalAmountOfEntries}
                onPageChange={e => setCurrentPage(e.page)}
              ></Paginator>
            </div>
          </div>
        </div>
      </When>
    </Choose>
  );
};

export default DashboardPage;
