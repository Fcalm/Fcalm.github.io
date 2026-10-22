"""读取历史评测汇总，生成可复核的产品分析；不是新一轮模型测试。"""
from pathlib import Path
import csv

ROOT = Path(__file__).resolve().parent


def summarize(source):
    results = []
    with source.open(encoding='utf-8', newline='') as handle:
        for row in csv.DictReader(handle):
            cases, completed = int(row['cases']), int(row['completed'])
            rounds, tokens = int(row['model_rounds']), int(row['total_tokens'])
            score = float(row['mean_score'])
            if cases <= 0 or not 0 <= completed <= cases or rounds < 0 or tokens < 0 or not 0 <= score <= 100:
                raise ValueError('评测数据口径不合法：' + row['task_type'])
            results.append({
                'task_type': row['task_type'], 'cases': cases,
                'completion_rate': completed / cases,
                'mean_score': score, 'rounds_per_case': rounds / cases,
                'tokens_per_case': tokens / cases,
            })
    return results


if __name__ == '__main__':
    for row in summarize(ROOT / 'baseline-summary.csv'):
        print('{task_type}: n={cases}, completion={completion_rate:.0%}, score={mean_score:g}, '
              'rounds/case={rounds_per_case:.1f}, tokens/case={tokens_per_case:,.1f}'.format(**row))
