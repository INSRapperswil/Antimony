import React, {MouseEvent, useMemo, useRef, useState} from 'react';

import {Button} from 'primereact/button';
import {ListBox} from 'primereact/listbox';
import {IconField} from 'primereact/iconfield';
import {InputIcon} from 'primereact/inputicon';
import {InputText} from 'primereact/inputtext';
import {SelectItem} from 'primereact/selectitem';
import {OverlayPanel} from 'primereact/overlaypanel';

import {matchesSearch} from '@sb/lib/Utils';
import {NodeEditor} from '@sb/lib/NodeEditor';
import NodePropertyTableRow from './NodePropertyTableRow';

import './NodePropertyTable.sass';
import classNames from 'classnames';

interface NodePropertyTableProps {
  nodeEditor: NodeEditor;
}

const NodePropertyTable: React.FC<NodePropertyTableProps> = (
  props: NodePropertyTableProps
) => {
  const [availableProperties, setAvailableProperties] = useState<SelectItem[]>(
    []
  );
  const [propertyQuery, setPropertyQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');

  const propertyList: SelectItem[] = useMemo(() => {
    if (!propertyQuery) return availableProperties;

    return availableProperties.filter(property =>
      matchesSearch(property.value!, propertyQuery)
    );
  }, [availableProperties, propertyQuery]);

  const newPropertyOverlayRef = useRef<OverlayPanel>(null);
  const newPropertyInputRef = useRef<HTMLInputElement>(null);

  const propertyTable = useMemo(
    () =>
      props.nodeEditor
        .getProperties()
        .map(property => (
          <NodePropertyTableRow
            key={property.index}
            propertyKey={property.key}
            propertyValue={property.value}
            propertyDefinition={
              props.nodeEditor.clabSchema.definitions['node-config'].properties[
                property.key
              ]
            }
            wasEdited={props.nodeEditor.wasPropertyEdited(
              property.key,
              property.value,
              property.type
            )}
            onUpdateValue={newValue =>
              props.nodeEditor.onPropertyValueUpdate(
                property.key,
                newValue,
                property.type
              )
            }
          />
        )),
    [props.nodeEditor]
  );

  function onAddPropertyOpen(event: MouseEvent<HTMLButtonElement>) {
    if (!newPropertyOverlayRef) return;

    setAvailableProperties(
      props.nodeEditor.getAvailableProperties().map(property => ({
        value: property,
      }))
    );
    setPropertyQuery('');
    newPropertyOverlayRef.current?.show(event, event.target);
    newPropertyInputRef.current?.focus();
  }

  function onAddProperty(key: string) {
    console.log('ADD:', key);
  }

  const propertyListTemplate = (option: OptionGroupOptions) => {
    return (
      <div
        className={classNames('flex align-items-center gap-3', {
          selected: selectedProperty === option.optionGroup.value,
        })}
      >
        <i className="pi pi-wrench"></i>
        <span>{option.optionGroup.value}</span>
      </div>
    );
  };

  return (
    <>
      <table className="sb-table">
        <thead>
          <tr>
            <td>Property</td>
            <td>Value</td>
            <td className="p-0">Type</td>
          </tr>
        </thead>
        <tbody>{propertyTable}</tbody>
      </table>
      <div className="flex justify-content-center">
        <Button
          label="Add Property"
          icon="pi pi-plus"
          className="sb-table-add-button"
          onClick={onAddPropertyOpen}
        />
        <OverlayPanel
          ref={newPropertyOverlayRef}
          className="sb-node-new-property-overlay"
          pt={{
            hooks: {
              useMountEffect() {
                newPropertyInputRef.current?.focus();
              },
            },
          }}
        >
          <IconField iconPosition="left">
            <InputIcon className="pi pi-search"> </InputIcon>
            <InputText
              ref={newPropertyInputRef}
              placeholder="Search"
              value={propertyQuery}
              onChange={e => setPropertyQuery(e.target.value)}
            />
          </IconField>
          <ListBox
            onChange={e => onAddProperty(e.value)}
            options={propertyList}
            className="w-full md:w-14rem"
            emptyMessage="No matching properties found"
            optionGroupLabel="value"
            optionGroupTemplate={propertyListTemplate}
          />
        </OverlayPanel>
      </div>
    </>
  );
};

type OptionGroupOptions = {
  optionGroup: {
    value: string;
  };
};

export default NodePropertyTable;
