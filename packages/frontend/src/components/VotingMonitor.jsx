import React, { useState, useMemo } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'react-hot-toast';
import VotingContractData from '../abis/Voting.json';
const contractABI = VotingContractData.abi;
import { 
  Box, Typography, Paper, LinearProgress, Button, 
  Grid, Card, CardContent, Chip, Stack, Alert, Divider, useTheme 
} from '@mui/material';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TimerIcon from '@mui/icons-material/Timer';

export default function VotingMonitor({ voting }) {
  const theme = useTheme();
  const contractAddress = voting.contract_address;
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { data: votingActive, refetch: refetchStatus } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'votingActive',
    watch: true, 
  });
  
  const { data: results, refetch: refetchResults } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getResults',
    watch: true, 
  });

  const { totalVotes, percentages, winner } = useMemo(() => {
    if (!results) return { totalVotes: 0, percentages: [], winner: null };

    const total = results.reduce((acc, opt) => acc + Number(opt.voteCount), 0);
    const percs = results.map(opt => {
      if (total === 0) return 0;
      return (Number(opt.voteCount) * 100) / total;
    });
    
    let maxVotes = -1;
    let win = null;
    if (!votingActive && total > 0) {
       results.forEach(opt => {
         if (Number(opt.voteCount) > maxVotes) {
           maxVotes = Number(opt.voteCount);
           win = opt;
         }
       });
    }

    return { totalVotes: total, percentages: percs, winner: win };
  }, [results, votingActive]);

  const handleStopVoting = () => {
    const toastId = toast.loading('Agitando bandera a cuadros en la blockchain...');
    
    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'stopVoting',
    }, {
      onError: (err) => {
        toast.dismiss(toastId);
        toast.error(`Error: ${err.message}`);
      }
    });
  };

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
    onSuccess: () => {
      toast.dismiss();
      toast.success('¡Carrera finalizada! Los resultados son oficiales en la Blockchain.');
      refetchStatus();
      refetchResults();
    }
  });

  if (!results) return <LinearProgress color="secondary" />;

  return (
    <Paper 
      sx={{ 
        p: 4, 
        mt: 3, 
        bgcolor: '#242424', 
        borderLeft: `6px solid ${theme.palette.primary.main}`, 
        boxShadow: '0 0 10px rgba(255, 40, 0, 0.2)' 
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EqualizerIcon color="primary" sx={{ fontSize: 30 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
            TELEMETRÍA DE LA VOTACIÓN
          </Typography>
        </Box>
        
        {votingActive ? (
          <Chip 
            icon={<TimerIcon />} 
            label="CARRERA EN CURSO" 
            color="success" 
            variant="outlined" 
            sx={{ fontWeight: 'bold', border: `2px solid ${theme.palette.success.main}` }}
          />
        ) : (
          <Chip 
            label="FINALIZADA" 
            color="error" 
            variant="filled" 
            sx={{ fontWeight: 'bold', bgcolor: theme.palette.error.dark }}
          />
        )}
      </Box>
      <Stack spacing={2} sx={{ mb: 4 }}>
        {results.map((opt, index) => (
          <Box key={index}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body1" fontWeight="bold" sx={{ color: 'white' }}>{opt.name}</Typography>
              <Typography variant="body2" sx={{ color: theme.palette.primary.light }}>
                {opt.voteCount.toString()} votos ({percentages[index].toFixed(2)}%)
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={percentages[index]} 
              sx={{ 
                height: 12, 
                borderRadius: 6, 
                bgcolor: '#333',
                '& .MuiLinearProgress-bar': {
                  bgcolor: theme.palette.primary.main
                }
              }}
            />
          </Box>
        ))}
        <Typography variant="caption" align="center" sx={{ color: 'text.secondary', mt: 2 }}>
          Total de Votos Registrados en Blockchain: {totalVotes}
        </Typography>
      </Stack>

      <Divider sx={{ my: 3, borderColor: 'rgba(255,40,0,0.5)' }} />
      
      {votingActive ? (
        <Box sx={{ textAlign: 'center' }}>
          <Alert severity="info" sx={{ mb: 2, background: 'rgba(2,136,209,0.1)', color: 'white', border: '1px solid #0288D1' }}>
            La votación terminará el {new Date(voting.end_time).toLocaleString()} automáticamente.
          </Alert>
          
          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={<StopCircleIcon />}
            onClick={handleStopVoting}
            disabled={isPending || isConfirming}
            sx={{ fontWeight: 'bold', px: 4, bgcolor: theme.palette.error.dark, py: 1.5 }}
          >
            {isPending ? 'DETENIENDO...' : 'FINALIZAR VOTACIÓN AHORA (MANUAL)'}
          </Button>
          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
            Advertencia: Finalizar la votación manualmente ejecuta un contrato y es irreversible.
          </Typography>
        </Box>
      ) : (
        <Card variant="outlined" sx={{ 
          borderColor: theme.palette.secondary.main, 
          backgroundColor: 'rgba(0, 200, 255, 0.05)', 
          boxShadow: `0 0 15px ${theme.palette.secondary.main}50` 
        }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="overline" color="secondary" sx={{ letterSpacing: 3, fontWeight: 700 }}>
              REPORTE OFICIAL DE CIERRE
            </Typography>
            
            <Box sx={{ my: 2 }}>
              <EmojiEventsIcon sx={{ fontSize: 70, color: theme.palette.secondary.main }} />
            </Box>
            
            {winner ? (
              <>
                <Typography variant="h3" sx={{ color: theme.palette.secondary.main, fontWeight: 900, fontFamily: '"Exo 2"' }}>
                  {winner.name.toUpperCase()}
                </Typography>
                <Typography variant="h6" sx={{ mt: 1, color: 'white' }}>
                  ¡GANADOR DECLARADO! Con {winner.voteCount.toString()} votos
                </Typography>
              </>
            ) : (
              <Typography variant="h6" color="text.secondary">
                No hubo votos registrados en la Blockchain.
              </Typography>
            )}
            
            <Box sx={{ mt: 3, p: 2, borderTop: '1px dashed #555' }}>
              <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                DIRECCIÓN DEL CONTRATO:
              </Typography>
              <Typography variant="caption" fontFamily="monospace" color="white">
                {contractAddress}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Paper>
  );
}