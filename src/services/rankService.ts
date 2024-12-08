interface ScoreData {
  score: number;
  count: number;
  cumulative: number;
}

class RankService {
  private scoreData: ScoreData[] = [];

  private parseCSV(csv: string): ScoreData[] {
    const lines = csv.trim().split('\n');
    const result: ScoreData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].split(',');
      result.push({
        score: parseInt(line[0]),
        count: parseInt(line[1]),
        cumulative: parseInt(line[2])
      });
    }
    return result;
  }

  async loadScoreData(): Promise<void> {
    try {
      const response = await fetch(import.meta.env.BASE_URL + 'config/2020.csv');
      const csv = await response.text();
      this.scoreData = this.parseCSV(csv);
    } catch (error) {
      console.error("Error loading score data:", error);
    }
  }

  async queryRank(score: number): Promise<number> {
    if (this.scoreData.length === 0) {
      await this.loadScoreData();
    }

    for (const data of this.scoreData) {
      if (data.score === score) {
        return data.cumulative;
      }
    }
    return -1;
  }
}

export const rankService = new RankService(); 