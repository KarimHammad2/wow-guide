-- Correct WOW emergency line: +41 41 552 33 33 (was missing the second "41" area code).

update public.buildings
set emergency_phone = '+41 41 552 33 33'
where emergency_phone = '+41 552 33 33'
   or replace(emergency_phone, ' ', '') = '+415523333';

update public.emergency_contacts
set phone = '+41 41 552 33 33'
where phone = '+41 552 33 33'
   or replace(phone, ' ', '') = '+415523333';
