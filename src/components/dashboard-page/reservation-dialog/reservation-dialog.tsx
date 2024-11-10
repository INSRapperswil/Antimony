import React, {useState} from 'react';
import {Lab} from '@sb/types/types';
import {Calendar} from 'primereact/calendar';

import './reservation-dialog.sass';
import {InputText} from 'primereact/inputtext';
import SBDialog from '@sb/components/common/sb-dialog/sb-dialog';

interface ReservationDialogProps {
  lab: Lab;
  closeDialog: () => void;
}

const ReservationDialog: React.FC<ReservationDialogProps> = (
  props: ReservationDialogProps
) => {
  const initialStartDate = new Date(props.lab.startDate!);
  const initialEndDate = new Date(props.lab.endDate!);

  const [startDate, setStartDate] = useState<Date | null>(initialStartDate);
  const [startTime, setStartTime] = useState<Date | null>(initialStartDate!);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate!);
  const [endTime, setEndTime] = useState<Date | null>(initialEndDate!);

  const combineDateAndTime = (date: Date | null, time: Date | null): string => {
    if (date && time) {
      const combinedDate = new Date(date);
      combinedDate.setHours(time.getHours());
      combinedDate.setMinutes(time.getMinutes());
      combinedDate.setSeconds(time.getSeconds());
      return combinedDate.toISOString();
    }
    return '';
  };
  const handleSave = () => {
    const newStartDate = combineDateAndTime(startDate, startTime);
    const newEndDate = combineDateAndTime(endDate, endTime);

    // Print or use the updated ISO strings
    console.log('New Start Date:', newStartDate);
    console.log('New End Date:', newEndDate);

    // You can now send these updated values to an API if needed
  };

  return (
    <SBDialog
      isOpen={props.lab !== null}
      onClose={props.closeDialog}
      headerTitle="Rescheduling Dialog"
      className="dialog-lab-reservation"
      onSubmit={() => {
        handleSave();
        props.closeDialog();
      }}
      onCancel={() => props.closeDialog()}
    >
      <div className="update-reservation-container">
        <div className="form-field">
          <span>Lab Name:</span>
          <InputText className="input-field" value={props.lab.name} readOnly />
        </div>
        <div className="date-time-form">
          <div className="form-field">
            <span>Start Date</span>
            <Calendar
              value={startDate}
              onChange={e => setStartDate(e.value!)}
              dateFormat="yy-mm-dd"
              showIcon
            />
          </div>

          <div className="form-field">
            <span>Start Time</span>
            <Calendar
              value={startTime}
              onChange={e => setStartTime(e.value!)}
              timeOnly
              hourFormat="24"
              showIcon
              icon="pi pi-clock"
            />
          </div>
        </div>
        <div className="date-time-form">
          <div className="form-field">
            <span>End Date</span>
            <Calendar
              value={endDate}
              onChange={e => setEndDate(e.value!)}
              dateFormat="yy-mm-dd"
              showIcon
            />
          </div>

          <div className="form-field">
            <span>End Time</span>
            <Calendar
              value={endTime}
              onChange={e => setEndTime(e.value!)}
              timeOnly
              hourFormat="24"
              showIcon
              icon="pi pi-clock"
            />
          </div>
        </div>
      </div>
    </SBDialog>
  );
};

export default ReservationDialog;
