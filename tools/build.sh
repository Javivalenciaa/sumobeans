#!/bin/bash
cd "$(dirname "$0")/.." && cat src/part1.html src/part2.js src/part3.js src/part4.js src/part5.js > index.html && printf '</script>\n</body>\n</html>\n' >> index.html && echo built
