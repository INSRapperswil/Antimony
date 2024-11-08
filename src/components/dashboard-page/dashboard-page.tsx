import React, {MouseEvent, useEffect, useState} from 'react';

import {Chip} from 'primereact/chip';
import {Dialog} from 'primereact/dialog';
import {InputText} from 'primereact/inputtext';
import {IconField} from 'primereact/iconfield';
import {InputIcon} from 'primereact/inputicon';

import {Lab, LabState} from '@sb/types/types';
import {useResource} from '@sb/lib/utils/hooks';
import {
  useAPIStore,
  useGroupStore,
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

const statusIcons: Record<LabState, string> = {
  [LabState.Scheduled]: 'pi pi-calendar',
  [LabState.Deploying]: 'pi pi-sync pi-spin',
  [LabState.Running]: 'pi pi-check',
  [LabState.Failed]: 'pi pi-times',
  [LabState.Done]: 'pi pi-check',
};

const DashboardPage: React.FC = () => {
  const [FilterDialogVisible, setFilterDialogVisible] =
    useState<boolean>(false);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<LabState[]>([
    LabState.Deploying,
    LabState.Running,
  ]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalAmountOfEntries, setTotalAmountOfEntries] = useState<number>(0);
  const [pageSize] = useState<number>(6);

  const groupStore = useGroupStore();
  const notificationStore = useNotifications();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reschedulingDialog, setReschedulingDialog] = useState<boolean>(false);
  const [reschedulingDialogLab, setReschedulingDialogLab] =
    useState<Lab | null>(null);

  const labsPath = `/labs?limit=${pageSize}&offset=${currentPage * pageSize}&stateFilter=${JSON.stringify(selectedFilters)}&searchQuery=${searchQuery}`;
  const [labQuery] = useResource<Lab[]>(labsPath, useAPIStore(), []);
  useEffect(() => {
    setTotalAmountOfEntries(10); //useResource needs update for api header
    setLabs(labQuery);
  }, [selectedFilters, totalAmountOfEntries, labQuery, currentPage]);

  useEffect(() => {
    console.log(labsPath);
  }, [labsPath]);

  function getGroupById(groupId?: String): String {
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
        // In the Scheduled state, return just the day and month in DD-MM format
        timeString = new Date(lab.startDate);
        return timeString.toISOString().split('T')[0];

      case LabState.Deploying:
      case LabState.Running:
        // In Deploying or Running state, return hh:mm from the start date
        timeString = new Date(lab.startDate);
        return timeString.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

      case LabState.Done:
      case LabState.Failed:
        // In Done or Failed state, return hh:mm from the end date
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
    setReschedulingDialog(true);
    setReschedulingDialogLab(lab);
  }

  function onStopLab(event: MouseEvent<HTMLButtonElement>, lab: Lab) {
    event.stopPropagation();
    notificationStore.confirm({
      message: 'This action cannot be undone.',
      header: `Stop Lab '${lab.name}'?`,
      icon: 'pi pi-power-off',
      severity: 'danger',
      onAccept: onStopConfirm,
    });
  }

  function onStopConfirm() {}

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
                onChange={e => setSearchQuery(e.target.value)}
              />
            </IconField>
            <span
              className="search-bar-icon"
              onClick={() => setFilterDialogVisible(true)}
            >
              <i className="pi pi-filter" />
            </span>
            <Dialog
              header={
                <div className="dialog-header">
                  <strong>Set Filters</strong>
                </div>
              }
              visible={FilterDialogVisible}
              className="dialog-content"
              onHide={() => setFilterDialogVisible(false)}
            >
              <div>
                <FilterDialog
                  filters={selectedFilters}
                  setFilters={setSelectedFilters}
                />
              </div>
            </Dialog>
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
            <If condition={searchQuery !== ''}>
              <Chip
                label={searchQuery}
                removable={true}
                onRemove={() => setSearchQuery('')}
                className="chip"
              />
            </If>
          </div>
          <div className="sb-labs-content">
            <Choose>
              <When condition={labs.length > 0}>
                <div className="lab-explorer-container">
                  {labs.map(lab => (
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
                            icon="pi pi-power-off"
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
                <Dialog
                  header={
                    <div className="dialog-header">
                      <strong>Update Reservation</strong>
                    </div>
                  }
                  visible={reschedulingDialog}
                  className="dialog-lab-reservation"
                  dismissableMask={true}
                  onHide={() => setReschedulingDialog(false)}
                >
                  <div>
                    <ReservationDialog
                      lab={reschedulingDialogLab!}
                      setRescheduling={setReschedulingDialog}
                    />
                  </div>
                </Dialog>
                {/* Dialog for Lab Details */}
                <Dialog
                  header={
                    <div className="dialog-header">
                      <div style={{flex: 1, textAlign: 'left'}}>
                        <strong>{getGroupById(selectedLab?.groupId)}</strong>{' '}
                      </div>
                      <div style={{flex: 1, textAlign: 'left'}}>
                        <strong>{selectedLab?.name}</strong>{' '}
                      </div>
                    </div>
                  }
                  visible={selectedLab !== null}
                  dismissableMask={true}
                  className="dialog-lab-details"
                  onHide={() => setSelectedLab(null)}
                >
                  <If condition={selectedLab}>
                    <div className="height-100">
                      <LabDialog
                        lab={selectedLab!}
                        groupName={getGroupById(selectedLab!.groupId)}
                      />
                    </div>
                  </If>
                </Dialog>
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
