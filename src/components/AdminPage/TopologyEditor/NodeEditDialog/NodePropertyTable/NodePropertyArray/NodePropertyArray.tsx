import React, {useMemo} from 'react';

import {Button} from 'primereact/button';

import {If} from '@sb/types/control';
import SBInput from '@sb/components/common/SBInput';

import './NodePropertyArray.sass';

interface NodePropertyArrayProps {
  entries: string[];
  minItems: number;
  uniqueItems?: boolean;

  onUpdateValue: (entries: string[]) => string | null;
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
    if (props.uniqueItems && props.entries.includes(value)) {
      return 'Array does not allow duplicate entries.';
    }

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
              key={entry.value}
              onValueSubmit={value => onEntryEdited(value, entry.index)}
              defaultValue={entry.value}
              placeholder="Empty"
              isHidden={true}
            />
            <If condition={props.entries.length > props.minItems}>
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
        icon="pi pi-plus"
        className="sb-property-array-add-button"
        onClick={onAddEntry}
      />
    </>
  );
};

export default NodePropertyArray;
