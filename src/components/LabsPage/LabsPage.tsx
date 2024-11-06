import React, {useContext, useEffect, useState} from 'react';

import {Chip} from 'primereact/chip';
import {Button} from 'primereact/button';
import {Dialog} from 'primereact/dialog';
import {InputText} from 'primereact/inputtext';
import {IconField} from 'primereact/iconfield';
import {InputIcon} from 'primereact/inputicon';

// eslint-disable-next-line n/no-extraneous-import
import {Lab, LabState} from '@sb/types/Types';
import {useResource} from '@sb/lib/utils/Hooks';
import {RootStoreContext} from '@sb/lib/stores/RootStore';
import LabDialog from '@sb/components/LabsPage/LabDialog/LabDialog';
import FilterDialog from '@sb/components/LabsPage/FilterDialog/FilterDialog';
import ReservationDialog from '@sb/components/LabsPage/ReservationDialog/ReservationDialog';
// eslint-disable-next-line n/no-extraneous-import
import {Choose, If, Otherwise, When} from '@sb/types/control';

import './LabsPage.sass';
import classNames from 'classnames';

const statusIcons: Record<LabState, string> = {
  [LabState.Scheduled]: 'pi pi-calendar',
  [LabState.Deploying]: 'pi pi-sync',
  [LabState.Running]: 'pi pi-check',
  [LabState.Failed]: 'pi pi-times',
  [LabState.Done]: 'pi pi-check',
};

const LabsPage: React.FC = () => {
  const [LabDialogVisible, setLabDialogVisible] = useState<boolean>(false);
  const [FilterDialogVisible, setFilterDialogVisible] =
    useState<boolean>(false);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<LabState[]>([
    LabState.Scheduled,
    LabState.Deploying,
    LabState.Running,
    LabState.Failed,
    LabState.Done,
  ]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalAmountOfEntries, setTotalAmountOfEntries] = useState<number>(0);
  const [pageSize] = useState<number>(6);

  const groupStore = useContext(RootStoreContext).groupStore;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reschedulingDialog, setReschedulingDialog] = useState<boolean>(false);

  const labsPath = `/labs?limit=${pageSize}&offset=${currentPage * pageSize}&stateFilter=${selectedFilters.join(',')}&searchQuery=${searchQuery}`;
  const [labQuery] = useResource<Lab[]>(
    labsPath,
    useContext(RootStoreContext).apiConnectorStore,
    []
  );
  useEffect(() => {
    setTotalAmountOfEntries(10); //useResource needs update for api header
    setLabs(labQuery);
  }, [selectedFilters, totalAmountOfEntries, labQuery, currentPage]);

  function getGroupById(groupId?: String): String {
    const group = groupStore.groups.find(group => group.id === groupId);
    if (group !== undefined) {
      return group.name;
    }
    return 'No group found';
  }

  const getFilteredLabs = () => {
    return labs.filter(lab => selectedFilters.includes(lab.state));
  };

  const handleNextPage = () => {
    if (totalAmountOfEntries / pageSize >= currentPage + 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  function handleEditLab(lab: Lab) {
    if (lab.state === LabState.Scheduled) {
      setReschedulingDialog(true);
      setSelectedLab(lab);
    }
  }

  function setDialog(state: boolean): void {
    setReschedulingDialog(state);
  }

  function handleLabDate(lab: Lab): string {
    let timeString: Date;

    switch (lab.state) {
      case LabState.Scheduled:
        // In the Scheduled state, return just the day and month in DD-MM format
        timeString = new Date(lab.startDate);
        return `${timeString.getDate().toString().padStart(2, '0')}-${(timeString.getMonth() + 1).toString().padStart(2, '0')}`;

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

  return (
    <If condition={labs}>
      <div className="bg-primary height-100 width-100 sb-card overflow-y-hidden overflow-x-hidden sb-labs-container">
        <div className="search-bar">
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
        <div className="bg-primary sb-labs-content">
          <Choose>
            <When condition={labs.length > 0}>
              <div className="lab-explorer-container">
                {getFilteredLabs().map(lab => (
                  <div key={lab.id} className="lab-item-card">
                    {/* Group */}
                    <div
                      className="lab-group sb-corner-tab"
                      onClick={() => {
                        setLabDialogVisible(true);
                        setSelectedLab(lab);
                      }}
                    >
                      <span>{getGroupById(lab.groupId)}</span>
                    </div>
                    {/* Lab Name */}
                    <div
                      className="lab-name"
                      onClick={() => {
                        setLabDialogVisible(true);
                        setSelectedLab(lab);
                      }}
                    >
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
                      <span
                        className="lab-state-label"
                        onClick={() => {
                          handleEditLab(lab);
                        }}
                      >
                        <i className={statusIcons[lab.state]}></i>
                        <label className="lab-state-date">
                          {handleLabDate(lab)}
                        </label>
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
                onHide={() => setDialog(false)}
              >
                <div>
                  <ReservationDialog
                    lab={selectedLab!}
                    setRescheduling={setReschedulingDialog}
                  />
                </div>
              </Dialog>
              <div className="pagination-controls">
                <Button
                  label="Previous"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 0}
                  className="pagination-button"
                />
                <span className="pagination-info">
                  Page {currentPage + 1} of{' '}
                  {Math.ceil(totalAmountOfEntries / pageSize)}
                </span>
                <Button
                  label="Next"
                  onClick={handleNextPage}
                  disabled={currentPage === totalAmountOfEntries / pageSize}
                  className="pagination-button"
                />
              </div>
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
                visible={LabDialogVisible}
                dismissableMask={true}
                className="dialog-lab-details"
                onHide={() => setLabDialogVisible(false)}
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
        </div>
      </div>
    </If>
  );
};

export default LabsPage;
