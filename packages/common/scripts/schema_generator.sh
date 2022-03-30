#!/bin/bash

# print generator usage
usage()
{
  echo "Usage: $(basename "$0") [-t <string>] [-i <string>] [-o <string>] -- generate schemas from TS and vice versa
    -t  type of conversion (schemas|types)
    -i  input directory
    -o  output directory" 1>&2; exit 1;
}

while getopts ":i:o:t:" k; do
    case "${k}" in
        i)
            i=${OPTARG}
            ;;
        o)
            o=${OPTARG}
            ;;
        t)
            t=${OPTARG}
            ;;
        *)
            usage
            ;;
    esac
done
shift $((OPTIND-1))

if [ -z "${i}" ] || [ -z "${o}" ] || [ -z "${t}" ]; then
    usage
fi

rm -r "${o}"
mkdir "${o}"

FILES="${i}/*"

for f in $FILES
do
 echo "Processing file $f"
 filename=$(basename -- "$f")

 case $t in
  "schemas")
    filename="${filename%.*}.json"
    npx typescript-json-schema "${f}" "*" -o "${o}/${filename}"
  ;;
  "types")
    filename="${filename%.*}.ts"
    npx json2ts -i "$f" -o "${o}/${filename}"
  ;;
   *) usage ;;
  esac
done

echo "Completed"
