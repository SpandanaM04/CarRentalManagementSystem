const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
fs.mkdirSync(DATA_DIR, { recursive: true });

const initial = {
  users: [],
  brands: [
    {id:1,name:'Toyota',description:'Reliable everyday drives'},
    {id:2,name:'Hyundai',description:'Comfort and value'},
    {id:3,name:'Royal Enfield',description:'Classic road adventures'},
    {id:4,name:'Honda',description:'Smooth city rides'}
  ],
  vehicles: [
    {id:1,brandId:1,name:'Toyota Corolla',type:'Car',category:'Comfort',price:2600,seats:5,fuel:'Petrol',transmission:'Automatic',image:'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=85',description:'Comfortable sedan for city rides and weekend escapes.',available:true},
    {id:2,brandId:2,name:'Hyundai Creta',type:'Car',category:'SUV',price:3400,seats:5,fuel:'Diesel',transmission:'Automatic',image:'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=85',description:'A versatile SUV with room for every plan.',available:true},
    {id:3,brandId:1,name:'Toyota Fortuner',type:'Car',category:'Premium SUV',price:5600,seats:7,fuel:'Diesel',transmission:'Automatic',image:'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=85',description:'Premium space and confidence for longer journeys.',available:true},
    {id:4,brandId:3,name:'Royal Enfield Classic 350',type:'Bike',category:'Cruiser',price:900,seats:2,fuel:'Petrol',transmission:'Manual',image:'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=85',description:'A timeless motorcycle for scenic rides.',available:true},
    {id:5,brandId:4,name:'Honda Activa',type:'Bike',category:'Scooter',price:500,seats:2,fuel:'Petrol',transmission:'Automatic',image:'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=85',description:'Easy, economical mobility around town.',available:true},
    {id:6,brandId:4,name:'Honda Hornet',type:'Bike',category:'Street',price:750,seats:2,fuel:'Petrol',transmission:'Manual',image:'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=85',description:'A nimble bike for your everyday commute.',available:true}
  ],
  rentals: [], testimonials: [], queries: [], subscribers: [],
  content: {heroTitle:'Your next journey starts here.',heroSubtitle:'Find your perfect ride. Book in minutes. Make every mile count.',about:'RentalHub makes getting around simple with a curated fleet of cars and bikes, transparent daily pricing and friendly support.'},
  contact: {email:'hello@rentalhub.com',phone:'+91 98765 43210',address:'Mysuru, Karnataka, India'}
};
function loadDB(){
  if(!fs.existsSync(DB_FILE)){
    initial.users.push({id:1,name:'RentalHub Admin',email:'admin@rentalhub.com',phone:'9999999999',password:bcrypt.hashSync('Admin@123',10),role:'admin',createdAt:new Date().toISOString()});
    fs.writeFileSync(DB_FILE, JSON.stringify(initial,null,2));
  }
  try { return JSON.parse(fs.readFileSync(DB_FILE,'utf8')); }
  catch(e){ console.error('Could not read data/db.json:',e); return JSON.parse(JSON.stringify(initial)); }
}
let db = loadDB();
function save(){ fs.writeFileSync(DB_FILE, JSON.stringify(db,null,2)); }
const nextId = arr => arr.reduce((m,x)=>Math.max(m,Number(x.id)||0),0)+1;
app.use(express.json({limit:'1mb'}));
app.use(express.urlencoded({extended:true}));
app.use(session({secret:process.env.SESSION_SECRET || 'replace-this-demo-secret',resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:'lax',maxAge:1000*60*60*4}}));
app.use(express.static(path.join(__dirname,'public')));

const publicUser = u => ({id:u.id,name:u.name,email:u.email,phone:u.phone||'',role:u.role,createdAt:u.createdAt});
function auth(req,res,next){ if(!req.session.userId) return res.status(401).json({error:'Please log in to continue.'}); next(); }
function admin(req,res,next){ const u=db.users.find(x=>x.id===req.session.userId); if(!u||u.role!=='admin') return res.status(403).json({error:'Admin access required.'}); next(); }
function current(req){return db.users.find(u=>u.id===req.session.userId);}
function safeVehicle(v){return {...v,brand:db.brands.find(b=>b.id===v.brandId)?.name||'Other'};}

app.get('/api/bootstrap',(req,res)=>res.json({user:current(req)?publicUser(current(req)):null,vehicles:db.vehicles.map(safeVehicle),brands:db.brands,content:db.content,contact:db.contact,testimonials:db.testimonials.filter(t=>t.status==='Active').map(t=>({...t,userName:db.users.find(u=>u.id===t.userId)?.name||'Customer'}))}));
app.get('/api/me',(req,res)=>res.json({user:current(req)?publicUser(current(req)):null}));
app.post('/api/register',async(req,res)=>{
 const {name,email,password,phone}=req.body;
 if(!name||!email||!password) return res.status(400).json({error:'Name, email and password are required.'});
 if(String(password).length<6) return res.status(400).json({error:'Password must be at least 6 characters.'});
 if(db.users.some(u=>u.email.toLowerCase()===String(email).trim().toLowerCase())) return res.status(409).json({error:'An account with this email already exists.'});
 const user={id:nextId(db.users),name:String(name).trim(),email:String(email).trim().toLowerCase(),phone:String(phone||'').trim(),password:await bcrypt.hash(password,10),role:'customer',createdAt:new Date().toISOString()};
 db.users.push(user);save();req.session.userId=user.id;res.json({user:publicUser(user),message:'Account created successfully.'});
});
app.post('/api/login',async(req,res)=>{
 const email=String(req.body.email||'').trim().toLowerCase(), password=String(req.body.password||'');
 const u=db.users.find(x=>x.email.toLowerCase()===email);
 if(!u||!await bcrypt.compare(password,u.password)) return res.status(401).json({error:'Invalid email or password.'});
 req.session.userId=u.id;res.json({user:publicUser(u),message:'Welcome back.'});
});
app.post('/api/logout',(req,res)=>req.session.destroy(()=>res.json({message:'Logged out.'})));
app.post('/api/forgot-password',async(req,res)=>{
 const email=String(req.body.email||'').trim().toLowerCase(), phone=String(req.body.phone||'').trim(), newPassword=String(req.body.newPassword||'');
 const u=db.users.find(x=>x.email.toLowerCase()===email && String(x.phone||'')===phone);
 if(!u) return res.status(400).json({error:'The email and registered phone number do not match.'});
 if(newPassword.length<6) return res.status(400).json({error:'New password must be at least 6 characters.'});
 u.password=await bcrypt.hash(newPassword,10);save();res.json({message:'Password reset successfully. You can now log in.'});
});
app.get('/api/vehicles',(req,res)=>res.json(db.vehicles.map(safeVehicle)));
app.get('/api/rentals',auth,(req,res)=>{const u=current(req);res.json(db.rentals.filter(b=>u.role==='admin'||b.userId===u.id).map(b=>({...b,vehicle:db.vehicles.find(v=>v.id===b.vehicleId)?.name||'Removed vehicle',customer:db.users.find(x=>x.id===b.userId)?.name||'Customer'})));});
app.post('/api/rentals',auth,(req,res)=>{
 const {vehicleId,startDate,endDate,pickupLocation}=req.body, v=db.vehicles.find(x=>x.id===Number(vehicleId));
 if(!v||!v.available) return res.status(400).json({error:'This vehicle is not available.'});
 const start=new Date(startDate),end=new Date(endDate);
 if(!startDate||!endDate||Number.isNaN(+start)||Number.isNaN(+end)||end<start) return res.status(400).json({error:'Please select a valid start and end date.'});
 const days=Math.max(1,Math.ceil((end-start)/86400000)+1);
 const rental={id:nextId(db.rentals),userId:current(req).id,vehicleId:v.id,startDate,endDate,pickupLocation:String(pickupLocation||'Mysuru').trim(),days,total:v.price*days,status:'Pending',createdAt:new Date().toISOString()};
 db.rentals.push(rental);save();res.json({message:'Rental request submitted. The admin will confirm it shortly.',rental});
});
app.put('/api/profile',auth,(req,res)=>{const u=current(req),{name,phone}=req.body;if(!name)return res.status(400).json({error:'Name is required.'});u.name=String(name).trim();u.phone=String(phone||'').trim();save();res.json({user:publicUser(u),message:'Profile updated.'});});
app.put('/api/password',auth,async(req,res)=>{const u=current(req);if(!await bcrypt.compare(String(req.body.currentPassword||''),u.password))return res.status(400).json({error:'Current password is incorrect.'});if(String(req.body.newPassword||'').length<6)return res.status(400).json({error:'New password must be at least 6 characters.'});u.password=await bcrypt.hash(req.body.newPassword,10);save();res.json({message:'Password changed successfully.'});});
app.post('/api/testimonials',auth,(req,res)=>{const message=String(req.body.message||'').trim(),rating=Number(req.body.rating||5);if(message.length<8)return res.status(400).json({error:'Please write at least 8 characters.'});const t={id:nextId(db.testimonials),userId:current(req).id,message,rating:Math.min(5,Math.max(1,rating)),status:'Inactive',createdAt:new Date().toISOString()};db.testimonials.push(t);save();res.json({message:'Thank you! Your testimonial will appear after admin approval.'});});
app.post('/api/contact',(req,res)=>{const {name,email,subject,message}=req.body;if(!name||!email||!message)return res.status(400).json({error:'Name, email and message are required.'});db.queries.push({id:nextId(db.queries),name:String(name).trim(),email:String(email).trim(),subject:String(subject||'General inquiry').trim(),message:String(message).trim(),status:'New',createdAt:new Date().toISOString()});save();res.json({message:'Your inquiry has been sent. We will get back to you soon.'});});
app.post('/api/subscribe',(req,res)=>{const email=String(req.body.email||'').trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Enter a valid email address.'});if(!db.subscribers.some(s=>s.email===email))db.subscribers.push({id:nextId(db.subscribers),email,createdAt:new Date().toISOString()});save();res.json({message:'You are subscribed to RentalHub updates.'});});

// Admin overview and management APIs
app.get('/api/admin/dashboard',auth,admin,(req,res)=>res.json({users:db.users.filter(u=>u.role==='customer').length,rentals:db.rentals.length,pending:db.rentals.filter(b=>b.status==='Pending').length,subscribers:db.subscribers.length,queries:db.queries.filter(q=>q.status!=='Resolved').length,vehicles:db.vehicles.length,brands:db.brands.length}));
app.get('/api/admin/data',auth,admin,(req,res)=>res.json({
 users:db.users.filter(u=>u.role!=='admin').map(publicUser),brands:db.brands,
 vehicles:db.vehicles.map(safeVehicle),
 rentals:db.rentals.map(b=>({...b,vehicle:db.vehicles.find(v=>v.id===b.vehicleId)?.name||'Removed vehicle',customer:db.users.find(u=>u.id===b.userId)?.name||'Customer',email:db.users.find(u=>u.id===b.userId)?.email||''})),
 testimonials:db.testimonials.map(t=>({...t,userName:db.users.find(u=>u.id===t.userId)?.name||'Customer'})),
 queries:db.queries,subscribers:db.subscribers,content:db.content,contact:db.contact
}));
app.post('/api/admin/brands',auth,admin,(req,res)=>{const name=String(req.body.name||'').trim();if(!name)return res.status(400).json({error:'Brand name is required.'});const b={id:nextId(db.brands),name,description:String(req.body.description||'').trim()};db.brands.push(b);save();res.json({message:'Brand created.',brand:b});});
app.put('/api/admin/brands/:id',auth,admin,(req,res)=>{const b=db.brands.find(x=>x.id===Number(req.params.id));if(!b)return res.status(404).json({error:'Brand not found.'});b.name=String(req.body.name||b.name).trim();b.description=String(req.body.description||'').trim();save();res.json({message:'Brand updated.'});});
app.delete('/api/admin/brands/:id',auth,admin,(req,res)=>{const id=Number(req.params.id);if(db.vehicles.some(v=>v.brandId===id))return res.status(400).json({error:'Delete or reassign vehicles using this brand first.'});db.brands=db.brands.filter(b=>b.id!==id);save();res.json({message:'Brand deleted.'});});
app.post('/api/admin/vehicles',auth,admin,(req,res)=>{const v=vehicleFrom(req.body,nextId(db.vehicles));if(!v.name||!v.price||!db.brands.some(b=>b.id===v.brandId))return res.status(400).json({error:'Vehicle name, valid brand and price are required.'});db.vehicles.push(v);save();res.json({message:'Vehicle added.'});});
app.put('/api/admin/vehicles/:id',auth,admin,(req,res)=>{const i=db.vehicles.findIndex(v=>v.id===Number(req.params.id));if(i<0)return res.status(404).json({error:'Vehicle not found.'});db.vehicles[i]={...db.vehicles[i],...vehicleFrom(req.body,db.vehicles[i].id)};save();res.json({message:'Vehicle updated.'});});
function vehicleFrom(x,id){return {id,name:String(x.name||'').trim(),brandId:Number(x.brandId),type:x.type==='Bike'?'Bike':'Car',category:String(x.category||'Standard'),price:Number(x.price)||0,seats:Number(x.seats)||2,fuel:String(x.fuel||'Petrol'),transmission:String(x.transmission||'Manual'),image:String(x.image||'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=85'),description:String(x.description||''),available:x.available!==false&&x.available!=='false'};}
app.delete('/api/admin/vehicles/:id',auth,admin,(req,res)=>{db.vehicles=db.vehicles.filter(v=>v.id!==Number(req.params.id));save();res.json({message:'Vehicle deleted.'});});
app.put('/api/admin/rentals/:id',auth,admin,(req,res)=>{const b=db.rentals.find(x=>x.id===Number(req.params.id));if(!b)return res.status(404).json({error:'Rental not found.'});if(!['Confirmed','Cancelled','Completed'].includes(req.body.status))return res.status(400).json({error:'Invalid rental status.'});b.status=req.body.status;save();res.json({message:`Rental ${b.status.toLowerCase()}.`});});
app.put('/api/admin/testimonials/:id',auth,admin,(req,res)=>{const t=db.testimonials.find(x=>x.id===Number(req.params.id));if(!t)return res.status(404).json({error:'Testimonial not found.'});t.status=req.body.status==='Active'?'Active':'Inactive';save();res.json({message:'Testimonial status updated.'});});
app.delete('/api/admin/queries/:id',auth,admin,(req,res)=>{db.queries=db.queries.filter(q=>q.id!==Number(req.params.id));save();res.json({message:'Query deleted.'});});
app.put('/api/admin/queries/:id',auth,admin,(req,res)=>{const q=db.queries.find(x=>x.id===Number(req.params.id));if(!q)return res.status(404).json({error:'Query not found.'});q.status=req.body.status==='Resolved'?'Resolved':'New';save();res.json({message:'Query updated.'});});
app.put('/api/admin/content',auth,admin,(req,res)=>{db.content={...db.content,heroTitle:String(req.body.heroTitle||db.content.heroTitle),heroSubtitle:String(req.body.heroSubtitle||db.content.heroSubtitle),about:String(req.body.about||db.content.about)};save();res.json({message:'Page content updated.'});});
app.put('/api/admin/contact',auth,admin,(req,res)=>{db.contact={email:String(req.body.email||db.contact.email),phone:String(req.body.phone||db.contact.phone),address:String(req.body.address||db.contact.address)};save();res.json({message:'Contact details updated.'});});
app.put('/api/admin/password',auth,admin,async(req,res)=>{const u=current(req);if(!await bcrypt.compare(String(req.body.currentPassword||''),u.password))return res.status(400).json({error:'Current password is incorrect.'});if(String(req.body.newPassword||'').length<6)return res.status(400).json({error:'New password must be at least 6 characters.'});u.password=await bcrypt.hash(req.body.newPassword,10);save();res.json({message:'Admin password changed.'});});
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`RentalHub is running at http://localhost:${PORT}`));
