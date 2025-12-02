import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VotingContractData from '../abis/Voting.json'; 
const contractABI = VotingContractData.abi; 
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'react-hot-toast';
import { 
  Container, Paper, Typography, Box, CircularProgress, 
  Alert, Button, Card, CardContent, LinearProgress, Stack, Tooltip,
  Chip, useTheme 
} from '@mui/material';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import FlagIcon from '@mui/icons-material/Flag';
import GavelIcon from '@mui/icons-material/Gavel';

export default function VotingPage() {
  const { id } = useParams(); 
  const { api } = useAuth();
  const { address } = useAccount();
  const navigate = useNavigate();
  const theme = useTheme();

  const [votingData, setVotingData] = useState(null); 
  const [candidatesDB, setCandidatesDB] = useState([]); 
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [loadingToastId, setLoadingToastId] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/votings/${id}/details`);
        setVotingData(res.data.voting);
        setCandidatesDB(res.data.candidates);
      } catch (error) {
        toast.error('Error al cargar los datos de la carrera.');
        navigate('/'); 
      } finally {
        setLoadingSetup(false);
      }
    };
    fetchDetails();
  }, [id, api, navigate]);

  const contractAddress = votingData?.contract_address;
  
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { data: hasVoted, refetch: refetchHasVoted } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'hasVoted',
    args: [address],
    query: { enabled: !!contractAddress && !!address } 
  });

  const { data: votingActive } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'votingActive',
    query: { enabled: !!contractAddress }
  });

  const { data: resultsOnChain, refetch: refetchResults } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getResults',
    query: { enabled: !!contractAddress }
  });

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
    onSuccess(data) {
      toast.dismiss(loadingToastId);
      toast.success(
        (t) => (
          <Box>
            ¡Voto Registrado! <br/>
            <a href={`https://sepolia.etherscan.io/tx/${data.transactionHash}`} target="_blank" rel="noopener noreferrer" style={{color: theme.palette.secondary.main}}>
              Ver Telemetría (Etherscan)
            </a>
          </Box>
        ), { duration: 8000 }
      );
      refetchResults();
      refetchHasVoted(); 
    },
    onError(err) {
      toast.dismiss(loadingToastId);
      toast.error(`Fallo en boxes: ${err.message}`);
    }
  });

  const handleVote = (candidateIndex) => {
    const tid = toast.loading('Firmando voto en MetaMask...');
    setLoadingToastId(tid);

    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'vote',
      args: [BigInt(candidateIndex)], 
    }, {
      onError: (err) => {
        toast.dismiss(tid);
        const errorMsg = err.message.includes('Ya has votado') ? 'Ya emitiste tu voto.' : 'Error al firmar.';
        toast.error(errorMsg);
      }
    });
  };

  const { totalVotes, votePercentages } = useMemo(() => {
    if (!resultsOnChain) return { totalVotes: 0n, votePercentages: [] };
    
    const total = resultsOnChain.reduce((acc, opt) => acc + opt.voteCount, 0n);
    
    const percentages = resultsOnChain.map(opt => {
      if (total === 0n) return 0;
      return Number((opt.voteCount * 10000n) / total) / 100;
    });
    
    return { totalVotes: total, votePercentages: percentages };

  }, [resultsOnChain]);


  if (loadingSetup) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      
      <Paper sx={{ p: 4, mb: 4, bgcolor: '#1E1E1E', borderLeft: `6px solid ${theme.palette.primary.main}` }}>
        <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 900 }}>
          {votingData.title}
        </Typography>
        <Typography variant="body1" paragraph color="text.secondary">
          {votingData.description || "Esta es la descripción oficial de la votación."}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
          {hasVoted && (
            <Chip label="VOTO EMITIDO" color="success" icon={<FlagIcon />} 
              sx={{ bgcolor: 'success.dark', color: 'white', fontWeight: 700 }}
            />
          )}
          {!votingActive && (
            <Chip label="CARRERA FINALIZADA" color="error" icon={<GavelIcon />} 
              sx={{ bgcolor: 'error.dark', color: 'white', fontWeight: 700 }}
            />
          )}
          <Chip label={`Total de Votos: ${totalVotes?.toString() || 0}`} variant="outlined" color="secondary" />
          <Chip label={`Contrato: ${contractAddress.substring(0, 6)}...`} variant="outlined" color="info" />
        </Box>
      </Paper>
      {!votingActive && (
        <Alert severity="warning" sx={{ mb: 3, bgcolor: '#301010', color: theme.palette.primary.light, border: '1px solid #FF2800' }}>
          Esta votación ha finalizado. Los resultados mostrados son los definitivos.
        </Alert>
      )}

      <Stack spacing={3}>
        {candidatesDB.map((candidate, index) => {
          const votes = resultsOnChain ? resultsOnChain[index].voteCount.toString() : '0';
          const percent = votePercentages[index] || 0;
          const isCurrentWinner = totalVotes > 0n && BigInt(votes) === resultsOnChain.reduce((max, c) => (c.voteCount > max ? c.voteCount : max), 0n);

          return (
            <Card 
              key={candidate.id} 
              sx={{ 
                bgcolor: '#1E1E1E', 
                border: isCurrentWinner ? `2px solid ${theme.palette.secondary.main}` : '1px solid #333', 
                transition: 'all 0.3s'
              }}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', mb: 1 }}>
                    {candidate.name}
                    {isCurrentWinner && (
                      <Chip label="LIDERANDO" size="small" color="secondary" sx={{ ml: 2, fontWeight: 700 }} />
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={percent} 
                      sx={{ 
                        height: 12, 
                        borderRadius: 6, 
                        flexGrow: 1, 
                        bgcolor: '#333',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: theme.palette.primary.main 
                        }
                      }} 
                    />
                    <Typography variant="body1" color="white" fontWeight="bold">
                      {percent.toFixed(2)}%
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    **{votes}** votos registrados en Blockchain.
                  </Typography> 
                </Box>

                <Tooltip title={hasVoted ? "Ya votaste" : !votingActive ? "Finalizado" : "Emitir Voto"}>
                  <span>
                    <Button
                      variant={hasVoted ? "outlined" : "contained"}
                      color={hasVoted ? "success" : "primary"}
                      startIcon={<HowToVoteIcon />}
                      disabled={hasVoted || !votingActive || isPending || isConfirming}
                      onClick={() => handleVote(index)}
                      size="large"
                      sx={{ fontWeight: 700 }}
                    >
                      {hasVoted ? "Votado" : "VOTAR"}
                    </Button>
                  </span>
                </Tooltip>

              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Container>
  );
}