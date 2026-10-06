import io
d='src/'
t=open(d+'template.html',encoding='utf-8').read()
three=open('three.min.js',encoding='utf-8').read()
game='(()=>{\n'+''.join(open(d+f,encoding='utf-8').read()+'\n' for f in ['a_core.js','b_world.js','c_game.js','d_ui.js'])+'})();'
t=t.replace('<script>/*THREE*/</script>','<script>'+three.replace('</script>','<\/script>')+'</script>')
t=t.replace('<script>/*GAME*/</script>','<script>'+game+'</script>')
open('index.html','w',encoding='utf-8').write(t)
print(len(t))
