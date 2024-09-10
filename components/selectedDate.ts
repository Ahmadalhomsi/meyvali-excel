export let selectedDate: any;
export let selectedUseToday: boolean = false;

export const setSelectedDate = (date: any) => {
    selectedDate = date;
}

export const setSelectedUseToday = (value: boolean) => {
    selectedUseToday = value;
}