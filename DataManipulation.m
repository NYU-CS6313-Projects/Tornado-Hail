% Finds and pairs the hail and tornadoes from same storm cell

close all
clear all

% import cvs files
torn = importfile('1950-2014_torn_.csv');
hail = importfile('1955-2014_hail_.csv');

% convert date to dateNumber for easy process
dateT=datenum(torn.date1)+datenum([torn.time])-datenum(today);
dateH=datenum(hail.date1)+datenum([hail.time])-datenum(today);

% define spatio-temporal reference limits
t_error = datenum(0,0,0,0,30,0); %datenum(Y,M,D,H,MN,S)
d_error = 0.25; % error isset to 0.25 degree

%initiliaze
names = fieldnames(torn);
pair=struct();
j=1;
% loop through all tornadoes to find the related hail
for i=1:length(dateT)
    % find same day hail
    ind = find( ( ( dateT(i)+t_error ) > dateH) .* ( (dateT(i)-t_error) < dateH )) ;
    if ~isempty(ind)
        % if same day event, check for spatial information
        LatCheck = (torn.slat(i) + d_error > hail.slat(ind)) .* (torn.slat(i) - d_error < hail.slat(ind));
        LonCheck = (torn.slon(i) + d_error > hail.slon(ind)) .* (torn.slon(i) - d_error < hail.slon(ind));
        % create new data for matched pairs
        if any(LatCheck.*LonCheck)
            [pair.sz(j,1),tmp]=max(hail.f(ind)); % get the largest hail size for multiple events
            % populate fields
            for k=1:length(names)
               pair=setfield(pair,names{k},{j,1},getfield(torn,names{k},{i,1}));
            end
            j=j+1 % increment the field index
        end
    end
end
% Save data
tmp=struct2table(pair);
writetable(tmp,'paired.csv')

