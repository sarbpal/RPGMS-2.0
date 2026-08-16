import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Alert,
  Box,
  Chip,
} from '@mui/material';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import SingleBedIcon from '@mui/icons-material/SingleBed';
import { defaultAccommodationRepository } from '../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { BedStatus } from '../../accommodation/domain/valueObjects/BedStatus';

interface AccommodationSelectionCardProps {
  flatId?: string;
  bedIds: string[];
  onChangeFlatId: (flatId: string) => void;
  onChangeBedIds: (bedIds: string[]) => void;
}

export const AccommodationSelectionCard: React.FC<AccommodationSelectionCardProps> = ({
  flatId,
  bedIds,
  onChangeFlatId,
  onChangeBedIds,
}) => {
  const repo = defaultAccommodationRepository;
  const flats = useMemo(() => repo.findAll(), [repo]);

  const selectedFlat = useMemo(() => {
    if (!flatId) return null;
    return flats.find((f) => f.id === flatId) || null;
  }, [flatId, flats]);

  const vacantBeds = useMemo(() => {
    if (!selectedFlat) return [];
    return selectedFlat.areas.flatMap((area) =>
      area.beds
        .filter((bed) => bed.status === BedStatus.VACANT)
        .map((bed) => ({
          ...bed,
          areaName: area.name,
        }))
    );
  }, [selectedFlat]);

  const handleBedToggle = (bedId: string) => {
    if (bedIds.includes(bedId)) {
      onChangeBedIds(bedIds.filter((id) => id !== bedId));
    } else {
      onChangeBedIds([...bedIds, bedId]);
    }
  };

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <MeetingRoomIcon color="primary" fontSize="small" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Accommodation Selection
          </Typography>
        </Stack>

        <Stack spacing={2}>
          <TextField
            select
            label="Select Flat *"
            fullWidth
            size="small"
            value={flatId || ''}
            onChange={(e) => {
              onChangeFlatId(e.target.value);
              onChangeBedIds([]);
            }}
          >
            {flats.map((flat) => (
              <MenuItem key={flat.id} value={flat.id}>
                {flat.name}
              </MenuItem>
            ))}
          </TextField>

          {!flatId && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Select a flat to view available vacant beds.
            </Alert>
          )}

          {selectedFlat && vacantBeds.length === 0 && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              No vacant beds available in {selectedFlat.name}.
            </Alert>
          )}

          {selectedFlat && vacantBeds.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Select Vacant Bed(s) in {selectedFlat.name}:
              </Typography>

              <FormGroup>
                <Grid container spacing={1}>
                  {vacantBeds.map((bed) => {
                    const isSelected = bedIds.includes(bed.id);
                    return (
                      <Grid size={{ xs: 12, sm: 6 }} key={bed.id}>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: isSelected ? 'primary.main' : '#e2e8f0',
                            bgcolor: isSelected ? '#f0f9ff' : 'background.paper',
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'space-between',
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleBedToggle(bed.id)}
                                size="small"
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SingleBedIcon fontSize="small" color={isSelected ? 'primary' : 'action'} />
                                <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500 }}>
                                  {bed.name} ({bed.areaName})
                                </Typography>
                              </Box>
                            }
                            sx={{ m: 0 }}
                          />
                          <Chip label="Vacant" color="success" size="small" variant="outlined" sx={{ fontWeight: 700, height: 20 }} />
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </FormGroup>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block' }}>
            Note: Bed selection is temporary preparation state. No beds are reserved or marked occupied until RA-6 execution.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};
