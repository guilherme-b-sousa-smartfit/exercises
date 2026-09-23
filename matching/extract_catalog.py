"""Read every populated catalog row; preserve source tab, row and ID as text."""
import argparse,json
from pathlib import Path
import openpyxl

def extract(path):
    workbook=openpyxl.load_workbook(path,data_only=True,read_only=True)
    fields=['id','name','type','body','equipment','gender','target','synergist']
    records=[]
    for sheet in workbook:
        header=next(sheet.iter_rows(min_row=1,max_row=1,values_only=True))
        if list(header[:2])!=['ID','Name']:
            raise ValueError(f'Unexpected headers: {sheet.title}')
        for rownum,row in enumerate(sheet.iter_rows(min_row=2,values_only=True),2):
            if row[0] and row[1]:
                records.append(dict(zip(fields,[str(v if v is not None else '') for v in row[:8]]))|{'tab':sheet.title,'row':rownum})
    workbook.close()
    return records
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('xlsx');parser.add_argument('output')
    args=parser.parse_args();records=extract(args.xlsx)
    Path(args.output).write_text(json.dumps(records,ensure_ascii=False,indent=2))
    print(f'{len(records)} catalog records extracted')
