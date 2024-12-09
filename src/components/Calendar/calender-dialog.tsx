import React, {useEffect, useMemo, useState} from 'react';
import {Dialog} from 'primereact/dialog';
import {useCalendarLabStore} from '@sb/lib/stores/root-store';
import {Calendar, momentLocalizer, View, Views} from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calender-dialog.sass';
import ReservationDialog from '@sb/components/dashboard-page/reservation-dialog/reservation-dialog';
import {Lab, LabState, uuid4} from '@sb/types/types';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  title: string;
  id: uuid4;
  state: LabState;
  start: Date;
  end: Date;
}

const labStateColors: {[key: number]: string} = {
  0: 'var(--info-color-text)',
  1: 'var(--warning-color-text)',
  2: 'var(--success-color-text)',
  3: 'var(--danger-color-text)',
  4: 'var(--neutral-color-text)',
};

interface CalendarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalendarDialog: React.FC<CalendarProps> = (props: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Lab | null>(null);
  const [currentView, setCurrentView] = useState<View>('month');

  const calendarLabStore = useCalendarLabStore();
  useEffect(() => {
    const startDate: Date = moment(currentDate).startOf('month').toDate();
    const endDate: Date = moment(currentDate).endOf('month').toDate();
    setDates(startDate, endDate);
    calendarLabStore.setLimit(1000);
    calendarLabStore.setStateFilter([
      LabState.Deploying,
      LabState.Done,
      LabState.Failed,
      LabState.Running,
      LabState.Scheduled,
    ]);
  }, []);

  function setDates(start: Date, end: Date): void {
    calendarLabStore.setStartDate(start.toISOString());
    calendarLabStore.setEndDate(end.toISOString());
  }

  const events = useMemo(() => {
    return calendarLabStore.data.map(lab => ({
      title: lab.name,
      id: lab.id,
      state: lab.state,
      start: new Date(lab.startDate),
      end: new Date(lab.endDate),
    }));
  }, [calendarLabStore.data]);

  const handleRangeChange = (range: Date[] | {start: Date; end: Date}) => {
    if (Array.isArray(range)) {
      const startDate = range[0];
      const endDate = range[range.length - 1];
      setDates(startDate, endDate);
    } else {
      setDates(range.start, range.end);
    }
  };

  const handleEventSelect = (event: CalendarEvent) => {
    if (event.state === LabState.Scheduled) {
      const lab: Lab | undefined = calendarLabStore.data.find(
        lab => lab.id === event.id
      );
      setSelectedEvent(lab!);
      setIsReservationDialogOpen(true);
    } else {
      return;
    }
  };

  function onClose(): void {
    setIsReservationDialogOpen(false);
  }

  const handleViewChange = (view: View): void => {
    setCurrentView(view);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = labStateColors[event.state];
    return {
      style: {
        backgroundColor, // Set the background color
        borderRadius: '5px',
        color: 'white', // Text color
        border: 'none',
        display: 'block',
      },
    };
  };

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
          view={currentView}
          defaultView="month"
          onView={handleViewChange}
          views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
          eventPropGetter={eventStyleGetter}
          toolbar={true}
          popup
          date={currentDate}
          onNavigate={date => setCurrentDate(date)}
          onRangeChange={handleRangeChange}
          onSelectEvent={handleEventSelect}
        />
      </div>
      {isReservationDialogOpen && (
        <ReservationDialog lab={selectedEvent!} onClose={onClose} />
      )}
    </Dialog>
  );
};

export default CalendarDialog;
