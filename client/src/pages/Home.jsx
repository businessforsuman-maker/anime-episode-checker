import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export default function Home() {
  const [animeList, setAnimeList] = useState(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [startItemNumber, setStartItemNumber] = useState(1);
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState(null);
  const [allResults, setAllResults] = useState([]);
  const [hasErrors, setHasErrors] = useState(false);
  const resultsRef = useRef(null);

  // Fetch the list of anime items
  const fetchListMutation = trpc.anime.fetchList.useQuery();

  // Fetch episodes for a specific item
  const fetchEpisodesMutation = trpc.anime.fetchEpisodes.useQuery;

  // Check anime item
  const checkAnimeItemMutation = trpc.anime.checkAnimeItem.useMutation();

  const handleFetchList = async () => {
    try {
      const data = await fetchListMutation.refetch();
      if (data.data) {
        setAnimeList(data.data.files || []);
        setCurrentItemIndex(Math.max(0, startItemNumber - 1));
      }
    } catch (error) {
      alert('Error fetching anime list: ' + error.message);
    }
  };

  const handleRunCheck = async () => {
    if (!animeList || animeList.length === 0) {
      alert('Please fetch the anime list first');
      return;
    }

    const startIdx = Math.max(0, startItemNumber - 1);
    if (startIdx >= animeList.length) {
      alert('Start item number is out of range');
      return;
    }

    setIsChecking(true);
    setResults(null);
    setHasErrors(false);

    try {
      const filename = animeList[startIdx];
      const result = await checkAnimeItemMutation.mutateAsync({
        filename,
        startFromEpisode: 1,
      });

      setResults(result);
      setHasErrors(result.errors && result.errors.length > 0);
      setAllResults([...allResults, result]);
      setCurrentItemIndex(startIdx + 1);
    } catch (error) {
      alert('Error checking anime item: ' + error.message);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRunNext = async () => {
    if (!animeList || currentItemIndex >= animeList.length) {
      alert('No more items to check');
      return;
    }

    setIsChecking(true);
    setResults(null);
    setHasErrors(false);

    try {
      const filename = animeList[currentItemIndex];
      const result = await checkAnimeItemMutation.mutateAsync({
        filename,
        startFromEpisode: 1,
      });

      setResults(result);
      setHasErrors(result.errors && result.errors.length > 0);
      setAllResults([...allResults, result]);
      setCurrentItemIndex(currentItemIndex + 1);
    } catch (error) {
      alert('Error checking anime item: ' + error.message);
    } finally {
      setIsChecking(false);
    }
  };

  const handleDownloadResults = () => {
    if (allResults.length === 0) {
      alert('No results to download');
      return;
    }

    const dataStr = JSON.stringify(allResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anime-check-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Anime Episode Checker</h1>
          <p className="text-lg text-slate-600">
            Validate episode URLs and check for broken links in anime series
          </p>
        </div>

        {/* Control Panel */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Control Panel</CardTitle>
            <CardDescription>Configure and start checking anime episodes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startItem" className="block mb-2">
                  Start from Item Number
                </Label>
                <Input
                  id="startItem"
                  type="number"
                  min="1"
                  value={startItemNumber}
                  onChange={(e) => setStartItemNumber(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={isChecking}
                  className="w-full"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Total items available: {animeList ? animeList.length : 'Not loaded'}
                </p>
              </div>

              <div className="flex flex-col justify-end gap-2">
                <Button
                  onClick={handleFetchList}
                  disabled={isChecking || fetchListMutation.isLoading}
                  className="w-full"
                  variant="outline"
                >
                  {fetchListMutation.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading List...
                    </>
                  ) : (
                    'Fetch Anime List'
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleRunCheck}
                disabled={isChecking || !animeList}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'RUN'
                )}
              </Button>

              <Button
                onClick={handleRunNext}
                disabled={isChecking || !animeList || currentItemIndex >= animeList.length}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Run Next'
                )}
              </Button>

              <Button
                onClick={handleDownloadResults}
                disabled={allResults.length === 0}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Results
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Display */}
        {results && (
          <Card className="shadow-lg" ref={resultsRef}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {hasErrors ? (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-600">Check Results - Issues Found</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600">Check Results - All OK</span>
                  </>
                )}
              </CardTitle>
              <CardDescription>
                Item: {results.filename} | Episodes: {results.checkedEpisodes}/{results.totalEpisodes}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-100 rounded-lg">
                  <div>
                    <p className="text-sm text-slate-600">Total Episodes</p>
                    <p className="text-2xl font-bold text-slate-900">{results.totalEpisodes}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Checked</p>
                    <p className="text-2xl font-bold text-slate-900">{results.checkedEpisodes}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Errors</p>
                    <p className={`text-2xl font-bold ${hasErrors ? 'text-red-600' : 'text-green-600'}`}>
                      {results.errors.length}
                    </p>
                  </div>
                </div>

                {/* Error Details */}
                {hasErrors && (
                  <div className="border-l-4 border-red-600 bg-red-50 p-4 rounded">
                    <h3 className="font-semibold text-red-900 mb-3">Episodes with Issues:</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {results.errors.map((error, idx) => (
                        <div key={idx} className="bg-white p-3 rounded border border-red-200">
                          <p className="font-semibold text-red-700">Episode {error.episode}</p>
                          <p className="text-sm text-slate-600 mt-1">
                            <strong>Episode URL:</strong> {error.episodeUrl}
                          </p>
                          {error.error && (
                            <p className="text-sm text-red-600 mt-1">
                              <strong>Error:</strong> {error.error}
                            </p>
                          )}
                          {error.episodeStatus && !error.episodeValid && (
                            <p className="text-sm text-red-600 mt-1">
                              <strong>Status:</strong> {error.episodeStatus}
                            </p>
                          )}
                          {error.videoError && (
                            <p className="text-sm text-red-600 mt-1">
                              <strong>Video Error:</strong> {error.videoError}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {!hasErrors && (
                  <div className="border-l-4 border-green-600 bg-green-50 p-4 rounded">
                    <p className="text-green-900 font-semibold">
                      ✓ All episodes checked successfully! No errors found.
                    </p>
                  </div>
                )}

                {/* All Results Summary */}
                {results.results && results.results.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-slate-900 mb-2">Full Episode List:</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {results.results.map((result, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded text-sm ${
                            result.episodeValid && result.videoValid
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          <span className="font-semibold">Episode {result.episode}:</span>
                          {result.episodeValid && result.videoValid ? (
                            <span> ✓ OK</span>
                          ) : (
                            <span>
                              {' '}
                              ✗ {!result.episodeValid ? 'Episode URL broken' : ''}{' '}
                              {!result.videoValid ? 'Video URL broken' : ''}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Section */}
        {!results && (
          <Card className="shadow-lg bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">How to Use</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800 space-y-2">
              <p>
                1. Click <strong>Fetch Anime List</strong> to load all available anime items
              </p>
              <p>
                2. Set the <strong>Start from Item Number</strong> if you want to resume from a specific item
              </p>
              <p>
                3. Click <strong>RUN</strong> to check the first item (or specified item)
              </p>
              <p>
                4. Use <strong>Run Next</strong> to check the next item in the list
              </p>
              <p>
                5. Click <strong>Download Results</strong> to save all results as JSON (only when no errors found)
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
