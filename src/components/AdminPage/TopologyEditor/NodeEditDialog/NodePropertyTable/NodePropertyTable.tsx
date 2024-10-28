import {If} from '@sb/types/control';
import React, {
  MouseEvent,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {Button} from 'primereact/button';
import {ListBox} from 'primereact/listbox';
import {IconField} from 'primereact/iconfield';
import {InputIcon} from 'primereact/inputicon';
import {InputText} from 'primereact/inputtext';
import {SelectItem} from 'primereact/selectitem';
import {OverlayPanel} from 'primereact/overlaypanel';

import {matchesSearch} from '@sb/lib/Utils/Utils';
import {NodeEditor} from '@sb/lib/NodeEditor';
import NodePropertyTableRow from './NodePropertyTableRow';

import './NodePropertyTable.sass';

interface NodePropertyTableProps {
  nodeEditor: NodeEditor;

  objectKey: string;
  schemaKey: string;

  hideType?: boolean;
  isKeyEditable?: boolean;
  hasPropertyList: boolean;

  keyHeader?: string;
  valueHeader?: string;
  addText?: string;
}

const NodePropertyTable: React.FC<NodePropertyTableProps> = (
  props: NodePropertyTableProps
) => {
  const [availableProperties, setAvailableProperties] = useState<
    SelectItem[] | null
  >([]);
  const [propertyQuery, setPropertyQuery] = useState('');

  const propertyList: SelectItem[] | null = useMemo(() => {
    if (!availableProperties) return null;
    if (!propertyQuery) return availableProperties;

    return availableProperties.filter(property =>
      matchesSearch(property.value!, propertyQuery)
    );
  }, [availableProperties, propertyQuery]);

  const [propertyTable, setPropertyTable] = useState<ReactElement[]>([]);

  const onTopologyUpdate = useCallback(() => {
    setPropertyTable([
      ...props.nodeEditor
        .getObjectProperties(props.objectKey, props.schemaKey)
        .entries()
        .map(([index, property]) => (
          <NodePropertyTableRow
            key={index}
            property={property}
            propertyKey={property.key}
            showType={props.hideType}
            isKeyEditable={props.isKeyEditable}
          />
        )),
    ]);
  }, [
    props.isKeyEditable,
    props.nodeEditor,
    props.objectKey,
    props.schemaKey,
    props.hideType,
  ]);

  const newPropertyOverlayRef = useRef<OverlayPanel>(null);
  const newPropertyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    props.nodeEditor.onEdit.register(onTopologyUpdate);
    onTopologyUpdate();

    return () => props.nodeEditor.onEdit.unregister(onTopologyUpdate);
  }, [props.nodeEditor, onTopologyUpdate]);

  function onAddPropertyOpen(event: MouseEvent<HTMLButtonElement>) {
    if (!newPropertyOverlayRef) return;

    // If object does not have property list, add new property directly
    if (!props.hasPropertyList) {
      onAddProperty('');
      return;
    }

    setAvailableProperties(
      props.nodeEditor
        .getAvailableProperties(props.objectKey, props.schemaKey)
        ?.map(property => ({
          value: property,
        })) ?? null
    );
    setPropertyQuery('');
    newPropertyOverlayRef.current?.show(event, event.target);
    newPropertyInputRef.current?.focus();
  }

  function onAddProperty(key: string) {
    props.nodeEditor.addProperty(key, props.objectKey, props.schemaKey);
    newPropertyOverlayRef.current?.hide();
  }

  const propertyListTemplate = (option: OptionGroupOptions) => {
    return (
      <div
        className="flex align-items-center gap-3"
        onClick={() => onAddProperty(option.optionGroup.value)}
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
            <td className="sb-property-table-key">
              {props.keyHeader ?? 'Property'}
            </td>
            <td className="sb-property-table-value">
              {props.valueHeader ?? 'Value'}
            </td>
            <If condition={props.hideType}>
              <td className="sb-property-table-type">Type</td>
            </If>
            <td className="sb-property-table-actions"></td>
          </tr>
        </thead>
        <tbody>{propertyTable}</tbody>
      </table>
      <div className="flex justify-content-center">
        <Button
          label={props.addText ?? 'Add Property'}
          icon="pi pi-plus"
          className="sb-table-add-button"
          onClick={onAddPropertyOpen}
        />
        <If condition={propertyList}>
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
              options={propertyList!}
              className="w-full md:w-14rem"
              emptyMessage="No matching properties found"
              optionGroupLabel="value"
              optionGroupTemplate={propertyListTemplate}
            />
          </OverlayPanel>
        </If>
      </div>
    </>
  );
};

export default NodePropertyTable;
