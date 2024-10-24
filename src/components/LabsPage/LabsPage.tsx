import React, {useMemo, useState} from 'react';
import {useReady, useResource} from '@sb/lib/Hooks';
import {DeviceInfo, Group, Lab, LabState, Topology} from '@sb/types/Types';
import {APIConnector} from '@sb/lib/APIConnector';
import {InputText} from 'primereact/inputtext';
import {Dialog} from 'primereact/dialog';
import FilterDialog from '@sb/components/LabsPage/FilterDialog/FilterDialog';
import {Chip} from 'primereact/chip';
import {Choose, If, Otherwise, When} from '@sb/types/control';
import LabDialog from '@sb/components/LabsPage/LabDialog/LabDialog';
import {DeviceManager} from '@sb/lib/DeviceManager';

interface LabsPageProps {
  apiConnector: APIConnector;
}

const LabsPage: React.FC<LabsPageProps> = (props: LabsPageProps) => {
  const [labs] = useResource<Lab[]>('/labs', props.apiConnector, []);

  const [LabDialogVisible, setLabDialogVisible] = useState<boolean>(false);
  const [FilterDialogVisible, setFilterDialogVisible] =
    useState<boolean>(false);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<LabState[]>([
    LabState.Scheduled,
    LabState.Deploying,
    LabState.Running,
    LabState.Failed,
  ]);

  const [topologies] = useResource<Topology[]>(
    '/topologies',
    props.apiConnector,
    []
  );
  const [groups] = useResource<Group[]>('/groups', props.apiConnector, []);

  const [devices] = useResource<DeviceInfo[]>(
    '/devices',
    props.apiConnector,
    []
  );

  const deviceManager = useMemo(() => {
    if (!devices) return null;
    return new DeviceManager(devices);
  }, [devices]);

  const isReady = useReady(deviceManager);

  function getGroupById(groupId?: String): String {
    const group = groups.find(group => group.id === groupId);
    if (group !== undefined) {
      return group.name;
    }
    return 'No group found';
  }

  const getFilteredLabs = () => {
    console.log(labs);
    console.log(selectedFilters);
    return labs.filter(lab => selectedFilters.includes(lab.state));
  };

  return (
    <If condition={isReady}>
      <div className="bg-primary font-bold height-100 width-100 sb-card overflow-y-scroll overflow-x-hidden">
        <div
          className="search-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '1em',
            width: '100%',
            border: '1px solid #4DB6AC',
            borderRadius: '4px',
            backgroundColor: '#263238',
          }}
        >
          {/* Search Icon as a Separate Element */}
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 0.75em',
            }}
          >
            <i
              className="pi pi-search"
              style={{
                color: '#C3E4E9',
                fontSize: '1.2em',
              }}
            />
          </span>
          <InputText
            placeholder="Search here..."
            style={{
              flex: 1,
              width: '100%',
              backgroundColor: '#263238',
              color: '#C3E4E9',
              border: 'none',
              padding: '0.75em 0',
            }}
          />

          {/* Filter Icon as a Separate Element */}
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 0.75em',
              cursor: 'pointer',
            }}
          >
            <i
              className="pi pi-filter"
              style={{
                color: '#C3E4E9',
                fontSize: '1.2em',
              }}
              onClick={() => {
                setFilterDialogVisible(true);
              }}
            />
          </span>
          <Dialog
            header={
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '0 1em',
                }}
              >
                <div>
                  <strong>Set Filters</strong>
                </div>
              </div>
            }
            visible={FilterDialogVisible}
            style={{
              width: '80%',
              height: '70%',
              backgroundColor: '#1B2B34',
              color: '#C3E4E9',
              display: 'flex', // Flexbox for the dialog content
              flexDirection: 'column', // Ensure the dialog content is arranged in columns
            }}
            onHide={() => setFilterDialogVisible(false)}
          >
            <div>
              <FilterDialog
                filters={selectedFilters}
                setFilters={setSelectedFilters}
              ></FilterDialog>
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
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.5em 1em',
                margin: '0.25em',
                cursor: 'pointer',
                borderRadius: '16px',
                backgroundColor: '#4DB6AC',
                color: '#FFFFFF',
                fontWeight: 'bold',
              }}
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
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#1B2B34',
                      padding: '1em',
                      marginBottom: '1em',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}
                    onClick={() => {
                      setLabDialogVisible(true);
                      setSelectedLab(lab);
                    }}
                  >
                    {/* Group */}
                    <div style={{flex: 1}}>
                      <p style={{margin: 0, fontWeight: 'bold'}}>
                        {getGroupById(lab.groupId)}
                      </p>
                    </div>

                    {/* Lab Name */}
                    <div style={{flex: 2, textAlign: 'center'}}>
                      <p style={{margin: 0, fontWeight: 'bold'}}>{lab.name}</p>
                    </div>

                    {/* State */}
                    <div style={{flex: 1, textAlign: 'right'}}>
                      <span
                        style={{
                          backgroundColor: '#4DB6AC',
                          padding: '0.5em 1em',
                          borderRadius: '4px',
                          color: '#FFFFFF',
                          fontWeight: 'bold',
                        }}
                      >
                        {lab.state}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dialog for Lab Details */}
              <Dialog
                header={
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '0 1em',
                    }}
                  >
                    <div style={{flex: 1, textAlign: 'left'}}>
                      <strong>{getGroupById(selectedLab?.groupId)}</strong>{' '}
                    </div>
                    <div style={{flex: 1, textAlign: 'center'}}>
                      <strong>{selectedLab?.name}</strong>{' '}
                    </div>
                  </div>
                }
                visible={LabDialogVisible}
                style={{
                  width: '80%',
                  height: '70%',
                  backgroundColor: '#1B2B34',
                  color: '#C3E4E9',
                  display: 'flex', // Flexbox for the dialog content
                  flexDirection: 'column', // Ensure the dialog content is arranged in columns
                }}
                onHide={() => setLabDialogVisible(false)}
              >
                {selectedLab && (
                  <div>
                    <LabDialog
                      lab={selectedLab}
                      apiConnector={props.apiConnector}
                      topologies={topologies}
                      deviceManager={deviceManager!}
                    ></LabDialog>
                  </div>
                )}
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
