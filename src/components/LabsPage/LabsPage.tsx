import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {Chip} from 'primereact/chip';
import {Button} from 'primereact/button';
import {Dialog} from 'primereact/dialog';
import {InputText} from 'primereact/inputtext';

import {APIConnector} from '@sb/lib/APIConnector';
import {DeviceManager} from '@sb/lib/DeviceManager';
import {useReady, useResource} from '@sb/lib/utils/Hooks';
import {Choose, If, Otherwise, When} from '@sb/types/control';
import LabDialog from '@sb/components/LabsPage/LabDialog/LabDialog';
import {DeviceInfo, Group, Lab, LabState} from '@sb/types/Types';
import FilterDialog from '@sb/components/LabsPage/FilterDialog/FilterDialog';

import './LabsPage.sass';
import {IconField} from 'primereact/iconfield';
import {InputIcon} from 'primereact/inputicon';
import ReservationDialog from '@sb/components/LabsPage/ReservationDialog/ReservationDialog';

interface LabsPageProps {
  apiConnector: APIConnector;
}

const statusIcons: Record<LabState, string> = {
  [LabState.Scheduled]: 'pi pi-calendar',
  [LabState.Deploying]: 'pi pi-upload',
  [LabState.Running]: 'pi pi-sync',
  [LabState.Failed]: 'pi pi-times-circle',
  [LabState.Done]: 'pi pi-check',
};

const LabsPage: React.FC<LabsPageProps> = (props: LabsPageProps) => {
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
  const [pageSize] = useState<number>(7);
  const [groups] = useResource<Group[]>('/groups', props.apiConnector, []);
  const searchQueryRef = useRef('');
  const [searchQuery, setSearchQuery] = useState<String>('');
  const [reschedulingDialog, setReschedulingDialog] = useState<boolean>(false);
  const today = new Date();

  const [devices] = useResource<DeviceInfo[]>(
    '/devices',
    props.apiConnector,
    []
  );
  const labsPath = `/labs?limit=${pageSize}&offset=${currentPage * pageSize}&stateFilter=${selectedFilters.join(',')}&searchQuery=${searchQuery}`;
  const [labQuery] = useResource<Lab[]>(labsPath, props.apiConnector, []);

  useEffect(() => {
    setTotalAmountOfEntries(10); //useResource needs update for api header
    setLabs(labQuery);
  }, [selectedFilters, totalAmountOfEntries, labQuery, currentPage]);

  function getGroupById(groupId?: String): String {
    const group = groups.find(group => group.id === groupId);
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

  const handleSearch = useCallback(() => {
    setSearchQuery(searchQueryRef.current);
  }, []);

  const deviceManager = useMemo(() => {
    if (!devices) return null;
    return new DeviceManager(devices);
  }, [devices]);
  const isReady = useReady(deviceManager, labs);

  function handleEditLab(lab: Lab) {
    if (lab.state === LabState.Scheduled) {
      setReschedulingDialog(true);
      setSelectedLab(lab);
    }
  }

  function setDialog(state: boolean): void {
    setReschedulingDialog(state);
  }

  function handleLabDate(lab: Lab): String {
    let timeString: Date;
    if (lab.state === LabState.Scheduled) {
      timeString = new Date(lab.startDate);
    } else {
      timeString = new Date(lab.endDate);
    }
    if (
      timeString.getDate() === today.getDate() &&
      timeString.getMonth() === today.getMonth() &&
      timeString.getFullYear() === today.getFullYear()
    ) {
      return timeString.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return timeString.toISOString().split('T')[0];
    }
  }

  return (
    <If condition={isReady}>
      <div className="bg-primary font-bold height-100 width-100 sb-card overflow-y-auto overflow-x-hidden">
        <div className="search-bar">
          <IconField className="search-bar-input" iconPosition="left">
            <InputIcon className="pi pi-search"></InputIcon>
            <InputText
              className="width-100"
              placeholder="Search here..."
              onChange={e => {
                searchQueryRef.current = e.target.value;
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <Button
              className="pi-button"
              label="Reset"
              onClick={() => {
                setSearchQuery('');
              }}
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
        <div style={{display: 'flex', margin: '1em'}}>
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
          {searchQuery !== '' && (
            <Chip
              label={searchQuery as string}
              removable={true}
              onRemove={() => setSearchQuery('')}
              className="chip"
            />
          )}
        </div>
        <div className="bg-primary" style={{padding: '1em', color: '#C3E4E9'}}>
          <Choose>
            <When condition={labs.length > 0}>
              <div className="lab-explorer-container">
                {getFilteredLabs().map(lab => (
                  <div key={lab.id} className="lab-item-card">
                    {/* Group */}
                    <div
                      className="lab-group"
                      onClick={() => {
                        setLabDialogVisible(true);
                        setSelectedLab(lab);
                      }}
                    >
                      <p>{getGroupById(lab.groupId)}</p>
                    </div>
                    {/* Lab Name */}
                    <div
                      className="lab-name"
                      onClick={() => {
                        setLabDialogVisible(true);
                        setSelectedLab(lab);
                      }}
                    >
                      <p>{lab.name}</p>
                    </div>
                    {/* State */}
                    <div className="lab-state">
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
                onHide={() => setDialog(false)}
                modal={false}
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
                    <div style={{flex: 1, textAlign: 'center'}}>
                      <strong>{selectedLab?.name}</strong>{' '}
                    </div>
                  </div>
                }
                visible={LabDialogVisible}
                className="dialog-lab-details"
                onHide={() => setLabDialogVisible(false)}
              >
                <If condition={selectedLab}>
                  <div className="height-100">
                    <LabDialog
                      lab={selectedLab!}
                      apiConnector={props.apiConnector}
                      deviceManager={deviceManager!}
                      groupName={getGroupById(selectedLab!.groupId)}
                    />
                  </div>
                </If>
              </Dialog>
            </When>
            <Otherwise>
              <p>No labs found.</p>
            </Otherwise>
          </Choose>
        </div>
      </div>
    </If>
  );
};

export default LabsPage;
