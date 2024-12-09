import React, {useEffect, useState} from 'react';
import {Dialog} from 'primereact/dialog';
import {useLabStore} from '@sb/lib/stores/root-store';
import {Calendar, momentLocalizer, Views} from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
const localizer = momentLocalizer(moment);
import './calender-dialog.sass';
interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
}

interface CalendarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalendarDialog: React.FC<CalendarProps> = (props: CalendarProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const labStore = useLabStore();

  useEffect(() => {
    const fetchLabs = async () => {
      const labs = await labStore.fetchAllDirect();
      if (labs) {
        const transformedEvents = labs.map(lab => ({
          title: lab.name,
          start: new Date(lab.startDate),
          end: new Date(lab.endDate),
        }));
        setEvents(transformedEvents);
      } else {
      }
    };

    fetchLabs();
  }, [labStore]);

  return (
    <Dialog
      visible={props.isOpen}
      onHide={props.onClose}
      className="calender-dialog"
    >
      <div className="calendar-container" style={{height: '500px'}}>
        <Calendar
          localizer={localizer}
          events={events!}
          startAccessor="start"
          endAccessor="end"
          style={{height: '100%'}}
          defaultView="month"
          views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
          toolbar={true}
          popup
          date={currentDate}
          onNavigate={date => setCurrentDate(date)}
        />
      </div>
    </Dialog>
  );
};

export default CalendarDialog;
