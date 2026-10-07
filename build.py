import sys
# Usage:  python build.py          -> dist/index.html       (RELEASE: only runs on CrazyGames domains + localhost)
#         python build.py --test   -> dist/index_test.html  (same, plus *.github.io so it can be tested on GitHub Pages)
d='src/'
t=open(d+'template.html',encoding='utf-8').read()
three=open('three.min.js',encoding='utf-8').read()
game='(()=>{\n'+''.join(open(d+f,encoding='utf-8').read()+'\n' for f in ['a_core.js','i18n.js','b_world.js','e_maps.js','c_game.js','n_net.js','d_ui.js'])+'})();'
test='--test' in sys.argv
if test:
    a="/^127\.0\.0\.1$/]"
    assert a in game
    game=game.replace(a,"/^127\.0\.0\.1$/,/\.github\.io$/]",1)
t=t.replace('<script>/*THREE*/</script>','<script>'+three+'</script>')
t=t.replace('<script>/*GAME*/</script>','<script>'+game+'</script>')
out='index.html' if test else 'release/index.html'
open(out,'w',encoding='utf-8').write(t)
print(out,len(t))
