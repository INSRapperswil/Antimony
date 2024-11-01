import React, {useEffect, useMemo, useState} from 'react';

import {Chip} from 'primereact/chip';
import {Button} from 'primereact/button';
import {Dialog} from 'primereact/dialog';
import {InputText} from 'primereact/inputtext';

import {APIConnector} from '@sb/lib/APIConnector';
import {DeviceManager} from '@sb/lib/DeviceManager';
import {useReady, useResource} from '@sb/lib/Utils/Hooks';
import {Choose, If, Otherwise, When} from '@sb/types/control';
import LabDialog from '@sb/components/LabsPage/LabDialog/LabDialog';
import {DeviceInfo, Group, Lab, LabState, RawLab} from '@sb/types/Types';
import FilterDialog from '@sb/components/LabsPage/FilterDialog/FilterDialog';

import './LabsPage.sass';
import {IconField} from 'primereact/iconfield';
import {InputIcon} from 'primereact/inputicon';

interface LabsPageProps {
  apiConnector: APIConnector;
}

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
  ]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalAmountOfEntries, setTotalAmountOfEntries] = useState<number>(0);
  const [pageSize] = useState<number>(8);
  const [groups] = useResource<Group[]>('/groups', props.apiConnector, []);

  const [devices] = useResource<DeviceInfo[]>(
    '/devices',
    props.apiConnector,
    []
  );

  const defaultLabQuery: RawLab = {
    item_Count: 0,
    labs: [],
  };

  const [labquery] = useResource<RawLab>(
    '/labs',
    props.apiConnector,
    defaultLabQuery
  );

  useEffect(() => {
    console.log(labquery);
    console.log(labquery.item_Count);
    setTotalAmountOfEntries(labquery.item_Count);
    setLabs(labquery.labs);
  }, [selectedFilters, totalAmountOfEntries, labquery]);

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
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const deviceManager = useMemo(() => {
    if (!devices) return null;
    return new DeviceManager(devices);
  }, [devices]);
  const isReady = useReady(deviceManager, labs);

  return (
    <If condition={isReady}>
      <div className="bg-primary font-bold height-100 width-100 sb-card overflow-y-auto overflow-x-hidden">
        <div className="search-bar">
          <IconField className="search-bar-input" iconPosition="left">
            <InputIcon className="pi pi-search"></InputIcon>
            <InputText className="width-100" placeholder="Search here..." />
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
        <div style={{display: 'flex', marginBottom: '1em'}}>
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
        </div>
        <div className="bg-primary" style={{padding: '1em', color: '#C3E4E9'}}>
          <Choose>
            <When condition={labs.length > 0}>
              <div className="lab-explorer-container">
                {getFilteredLabs().map(lab => (
                  <div
                    key={lab.id}
                    className="lab-item-card"
                    onClick={() => {
                      setLabDialogVisible(true);
                      setSelectedLab(lab);
                    }}
                  >
                    {/* Group */}
                    <div className="lab-group">
                      <p>{getGroupById(lab.groupId)}</p>
                    </div>

                    {/* Lab Name */}
                    <div className="lab-name">
                      <p>{lab.name}</p>
                    </div>

                    {/* State */}
                    <div className="lab-state">
                      <span className="lab-state-label">
                        {LabState[lab.state]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pagination-controls">
                <Button
                  label="Previous"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
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
