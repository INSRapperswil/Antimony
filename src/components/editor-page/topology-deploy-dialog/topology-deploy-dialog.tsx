import SBDialog from '@sb/components/common/sb-dialog/sb-dialog';
import SBDropdown from '@sb/components/common/sb-dropdown/sb-dropdown';
import {
  useLabStore,
  useNotifications,
  useTopologyStore,
} from '@sb/lib/stores/root-store';
import {If} from '@sb/types/control';
import {LabIn, Topology, uuid4} from '@sb/types/types';
import {Calendar} from 'primereact/calendar';
import {SelectItem} from 'primereact/selectitem';
import {Nullable} from 'primereact/ts-helpers';
import React, {useMemo, useState} from 'react';

import './topology-deploy-dialog.sass';

interface TopologyDeployDialogProps {
  deployingTopology: Topology | null;

  onClose: () => void;
}

const TopologyDeployDialog = (props: TopologyDeployDialogProps) => {
  const DefaultStartDate = () => new Date();
  const DefaultEndDate = () => {
    const now = new Date();
    now.setHours(now.getHours() + 2);
    return now;
  };

  const labStore = useLabStore();
  const topologyStore = useTopologyStore();
  const notificationStore = useNotifications();

  const [deployingTopology, setDeployingTopology] = useState<Topology | null>(
    props.deployingTopology
  );

  const [startDate, setStartDate] = useState<Nullable<Date>>(DefaultStartDate);
  const [endDate, setEndDate] = useState<Nullable<Date>>(DefaultEndDate);

  const topologyOptions: SelectItem[] = useMemo(() => {
    return topologyStore.data.map(topology => ({
      label: topology.definition.get('name') as string,
      value: topology.id,
    }));
  }, [topologyStore.data]);

  function onChangeTopology(topologyId: uuid4) {
    setDeployingTopology(topologyStore.lookup.get(topologyId)!);
  }

  function onDeploy() {
    if (!deployingTopology || !startDate || !endDate) return;

    const lab: LabIn = {
      name: deployingTopology?.definition.get('name') as string,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      topologyId: deployingTopology?.id,
    };

    labStore.add(lab).then(error => {
      if (error) {
        notificationStore.error(error.message, 'Failed to deploy topology');
      } else {
        notificationStore.success('Deployment has been scheduled.');
        props.onClose();
      }
    });
  }

  return (
    <SBDialog
      onClose={props.onClose}
      isOpen={props.deployingTopology !== null}
      headerTitle="Deploy Topology"
      className="sb-topology-deploy-dialog"
      submitLabel="Deploy"
      onSubmit={onDeploy}
      onCancel={props.onClose}
    >
      <If condition={deployingTopology}>
        <div className="flex gap-2 flex-column">
          <div className="mb-4">
            <SBDropdown
              id="deploy-topology"
              label="Topology"
              icon={<span className="material-symbols-outlined">lan</span>}
              hasFilter={true}
              useSelectTemplate={true}
              useItemTemplate={true}
              value={deployingTopology!.id}
              options={topologyOptions}
              emptyMessage="No topologies found"
              onValueSubmit={onChangeTopology}
            />
          </div>
          <div className="flex-auto">
            <label htmlFor="deploy-date-start" className="font-bold block mb-2">
              Start Time
            </label>
            <Calendar
              id="deploy-date-start"
              className="w-full"
              value={startDate}
              onChange={e => setStartDate(e.value as Nullable<Date | null>)}
              selectionMode="single"
              placeholder="Start Time"
              showIcon
              showTime
              showButtonBar
            />
          </div>
          <div className="flex-auto">
            <label htmlFor="deploy-date-end" className="font-bold block mb-2">
              End Time
            </label>
            <Calendar
              id="deploy-date-end"
              className="w-full"
              value={endDate}
              onChange={e => setEndDate(e.value as Nullable<Date | null>)}
              selectionMode="single"
              placeholder="End Time"
              showIcon
              showTime
              showButtonBar
            />
          </div>

          {/*<div className="flex align-items-center">*/}
          {/*  <Checkbox*/}
          {/*    inputId="group-edit-canrun"*/}
          {/*    onChange={e =>*/}
          {/*      setUpdatedGroup({*/}
          {/*        ...updatedGroup,*/}
          {/*        canRun: e.checked!,*/}
          {/*      })*/}
          {/*    }*/}
          {/*    checked={updatedGroup.canRun}*/}
          {/*  />*/}
          {/*  <label htmlFor="group-edit-canrun" className="ml-2">*/}
          {/*    Can Run*/}
          {/*  </label>*/}
          {/*</div>*/}
          {/*<div className="flex align-items-center">*/}
          {/*  <Checkbox*/}
          {/*    inputId="group-edit-canwrite"*/}
          {/*    onChange={e =>*/}
          {/*      setUpdatedGroup({*/}
          {/*        ...updatedGroup,*/}
          {/*        canWrite: e.checked!,*/}
          {/*      })*/}
          {/*    }*/}
          {/*    checked={updatedGroup.canWrite}*/}
          {/*  />*/}
          {/*  <label htmlFor="group-edit-canwrite" className="ml-2">*/}
          {/*    Can Write*/}
          {/*  </label>*/}
          {/*</div>*/}
        </div>
      </If>
    </SBDialog>
  );
};

export default TopologyDeployDialog;
