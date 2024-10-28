import SBInput from '@sb/components/common/SBInput';
import {If} from '@sb/types/control';
import {Button} from 'primereact/button';
import React, {useMemo} from 'react';

import './NodePropertyArray.sass';

interface NodePropertyArrayProps {
  entries: string[];
  onUpdateValue: (entries: string[]) => string | null;
}

interface EntryDefinition {
  value: string;
  index: number;
}

const NodePropertyArray: React.FC<NodePropertyArrayProps> = (
  props: NodePropertyArrayProps
) => {
  const entries = useMemo(() => {
    if (!props.entries) return [];
    return [
      ...props.entries.entries().map(([index, value]) => ({value, index})),
    ];
  }, [props.entries]);

  function onEntryEdited(value: string, index: number): string | null {
    props.entries[index] = value;
    return props.onUpdateValue(props.entries);
  }

  function onEntryRemoved(index: number) {
    props.onUpdateValue(props.entries.toSpliced(index, 1));
  }

  function onAddEntry() {
    props.onUpdateValue(props.entries.concat(['']));
  }

  return (
    <>
      <div className="sb-node-property-array">
        {entries.map(entry => (
          <div key={entry.index}>
            <SBInput
              key={entry.index}
              onValueSubmit={value => onEntryEdited(value, entry.index)}
              defaultValue={entry.value}
              placeholder="Empty"
              isHidden={true}
            />
            <If condition={props.entries.length > 1}>
              <Button
                icon="pi pi-trash"
                severity="danger"
                size="small"
                rounded
                text
                tooltip="Remove entry"
                tooltipOptions={{showDelay: 500}}
                onClick={() => onEntryRemoved(entry.index)}
              />
            </If>
          </div>
        ))}
      </div>
      <Button
        label="Add"
        icon="pi pi-plus"
        className="sb-table-add-button"
        onClick={onAddEntry}
      />
    </>
  );
};

export default NodePropertyArray;
